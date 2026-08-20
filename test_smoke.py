#!/usr/bin/env python3
"""Landing Pack smoke test — pure stdlib (urllib), no deps.
Run against a live server:  python3 test_smoke.py [base_url]
Exit 0 = all pass; non-zero = at least one failure.

Covers the security gates added during production hardening:
 - public endpoints stay open
 - private GET/POST require a signed sess (no-sess / forged-sess rejected)
 - admin console requires the admin token
"""
import json
import sys
import urllib.request
import urllib.error

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
results = []


def call(path, method="GET", body=None, token=None):
    url = BASE + path
    data = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        data = json.dumps(body).encode()
    if token:
        headers["X-Admin-Token"] = token
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:  # noqa
        return -1, str(e)


def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(("PASS" if cond else "FAIL"), "-", name, ("" if cond else ":: " + detail))


def jget(s, p):
    try:
        return json.loads(s).get(p)
    except Exception:
        return None


# 1. public health open
s, b = call("/api/health")
check("health public (200)", s == 200, f"status={s}")

# 2. private GET without sess -> rejected
s, b = call("/api/checks?uid=victim")
check("private GET no-sess rejected", s == 403 or jget(b, "error") == "auth", f"status={s} body={b}")

# 3. private GET forged sess -> rejected
s, b = call("/api/checks?uid=victim&sess=deadbeef")
check("private GET forged-sess rejected", s == 403 or jget(b, "error") == "auth", f"status={s} body={b}")

# 4. register -> get a real signed sess
s, b = call("/api/register", "POST", {"email": f"smoke_{__import__('time').time()}@qq.com", "password": "henry123", "name": "S", "lang": "zh"})
uid = jget(b, "uid")
sess = jget(b, "sess")
check("register returns uid+sess", bool(uid) and bool(sess), f"uid={uid} sess_len={len(sess or '')}")

# 5. private GET with valid sess -> ok
s, b = call(f"/api/checks?uid={uid}&sess={sess}")
check("private GET valid-sess ok", s == 200 and jget(b, "error") is None, f"status={s} body={b[:80]}")

# 6. private POST without sess -> rejected
s, b = call("/api/check", "POST", {"uid": uid, "task_id": 1, "done": 1})
check("private POST no-sess rejected", s == 403 or jget(b, "error") == "auth", f"status={s} body={b}")

# 7. admin overview without token -> 403
s, b = call("/api/admin/overview?uid=" + (uid or ""))
check("admin no-token rejected", s == 403, f"status={s}")

# 8. admin overview with token (will be 403 on wrong token, but must NOT be 200 without one)
s, b = call("/api/admin/check?uid=" + (uid or "") + "&admin_token=wrong")
check("admin wrong-token rejected", s == 403, f"status={s}")

# 9. subscription manage + account delete require a valid sess
for ep in ("/api/sub/cancel", "/api/sub/reactivate", "/api/account/delete"):
    s2, b2 = call(ep, "POST", {"uid": uid})
    check(f"{ep} no-sess rejected", s2 == 403 or jget(b2, "error") == "auth", f"status={s2} body={b2[:60]}")
# 10. seed an active subscription (test-only DB insert) so cancel/reactivate can be exercised
import sqlite3 as _sq, os as _os, datetime as _dt
_db = _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "landing.db")
try:
    _c = _sq.connect(_db); _c.execute("INSERT INTO subscribers(user_id,plan,status,expires_at) VALUES(?,?,?,?)",
        (uid, "pro_month", "active", (_dt.datetime.now() + _dt.timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S"))); _c.commit(); _c.close()
except Exception as ex:
    check("seed subscription", False, "db insert failed: " + str(ex))
# 11. positive: cancel -> me shows cancel_at_period_end; reactivate clears it
s2, b2 = call("/api/sub/cancel", "POST", {"uid": uid, "sess": sess})
check("sub/cancel valid ok", s2 == 200 and jget(b2, "error") is None, f"status={s2} body={b2[:60]}")
s2, b2 = call(f"/api/me?uid={uid}&sess={sess}")
check("me shows cancel_at_period_end after cancel", jget(b2, "cancel_at_period_end") is True, f"body={b2[:120]}")
s2, b2 = call("/api/sub/reactivate", "POST", {"uid": uid, "sess": sess})
check("sub/reactivate valid ok", s2 == 200 and jget(b2, "error") is None, f"status={s2}")
s2, b2 = call(f"/api/me?uid={uid}&sess={sess}")
check("me clears cancel_at_period_end after reactivate", jget(b2, "cancel_at_period_end") is False, f"body={b2[:120]}")
# 12. account delete valid (erases the test user)
s2, b2 = call("/api/account/delete", "POST", {"uid": uid, "sess": sess})
check("account/delete valid ok", s2 == 200 and jget(b2, "ok") is True, f"status={s2} body={b2[:60]}")

failed = [n for n, c, _ in results if not c]
print("\n%d/%d passed" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
