# Landing Pack — 部署与上线手册 (Ali Cloud 上海 + ICP备案)

后端是**纯 Python 标准库**（无 pip 依赖），部署极简。数据必须留在中国 → 用阿里云**轻量应用服务器（上海）**。

## 0. 准备（在你的 Mac 上）
- 注册并实名阿里云账号（https://www.aliyun.com）。
- 购买**轻量应用服务器**（镜像选 Ubuntu 22.04，地域选**华东（上海）**）。记下公网 IP。
- 在阿里云**万网**注册域名 `landingpackapp.com`（约 ¥85/年，必须 MIIT 可备案的注册商）。
- 域名实名认证（与服务器实名一致）。

## 1. 服务器初始化（SSH 进服务器）
```bash
ssh root@<你的服务器IP>
apt update && apt install -y python3 git
mkdir -p /var/lib/landingpack && cd /opt && git clone https://github.com/Henry-Omar/landing-pack.git
cd landing-pack
# 生成并保存一个稳定的管理员 token（务必记下来！）
openssl rand -hex 16
```

## 2. 启动服务（用 start.sh）
```bash
# 编辑环境变量（把上面的 token 填进去）
PORT=8000 \
ADMIN_EMAIL=you@landingpackapp.com \
ADMIN_TOKEN=<上一步的hex> \
APP_BASE_URL=https://landingpackapp.com \
PAYMENTS_ENABLED=0 \
DATA_DIR=/var/lib/landingpack \
nohup ./start.sh > /var/log/landingpack.log 2>&1 &
```
健康检查：`curl http://localhost:8000/api/health` → `{"ok":true}`

## 3. 反向代理 + HTTPS（阿里云自带或 nginx）
- 轻量应用服务器控制台可直接开启「HTTPS」并绑域名；或用 nginx 反代 8000。
- 申请免费 SSL（阿里云 DV 证书 / Let's Encrypt）。

## 4. ICP 备案（关键，未备案域名不能在国内访问）
- 阿里云控制台 → **ICP 备案** → 按向导提交（需服务器 IP + 域名 + 实名信息）。
- 备案期间域名不可访问，约 1–3 周。备完案后解析域名到服务器 IP。

## 5. 阶段二（上线收款时）
- 注册**个体工商户**。
- 开通微信支付 / 支付宝商户号，填入环境变量（WECHAT_MCH_ID / WECHAT_APIV3_KEY / ALIPAY_APP_ID / ALIPAY_APP_SECRET / STRIPE_SECRET_KEY）。
- 设 `PAYMENTS_ENABLED=1` 并重启。
- ⚠️ 支付宝当前代码用 HMAC-SHA256（非 RSA2）——生产上线前需改为 RSA2（见代码注释）。

## 6. 原生 App（Capacitor）
- `cd native && npm i && npx cap sync`
- 改 `native/src/copy-web.js` 的 `API_BASE` 为 `https://landingpackapp.com`
- `npx cap build ios` / `npx cap build android`，按商店要求提交。

## 安全提示
- 改掉默认管理员密码（注册后用真实强密码，避免 admin@landing.pack 弱密码）。
- `ADMIN_TOKEN` 只在后端、不进代码仓库；重启后若未用环境变量会重新随机生成（旧的登录会失效）。
- 后端已开启 WAL + busy_timeout + 写入重试，可承受中小并发。
