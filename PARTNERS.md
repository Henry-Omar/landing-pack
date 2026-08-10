# Finding & signing up partners (affiliate + b2b)

You (in Shanghai) don't need to *provide* visa/ticket/banking/insurance services —
you refer students to vetted providers and earn a commission or referral fee.
This is standard affiliate marketing; almost every student-service company has a
public "Affiliates" / "Partners" / "Referral" program.

## Step 1 — Sign up for affiliate programs (you do this)
For each partner below, go to their site → find "Affiliates" / "Partner" / "Referral"
→ apply (usually free) → you get a **tracking link** + a **commission rate**.
Paste that link into `server.py` `PRODUCTS` (replace `YOUR_xxx_ID`).

| Category | Partners to approach | What you earn |
|----------|---------------------|---------------|
| eSIM / SIM | Airalo, Holafly | $3–6 per order |
| Insurance | AXA, Allianz Care, Cigna | 5–10% of premium |
| Flights | Skyscanner, Trip.com, StudentUniverse | affiliate commission |
| Banking | Wise, Revolut, (local: 工行/中行 overseas student acct) | £50 / €10 referral |
| Essentials | Amazon (Associates), Taobao (淘宝客) | 3–8% |
| Visa / immigration assist | Visa agencies serving Chinese students (search 上海 留学签证 中介) | negotiate 10–20% referral |
| Accommodation | UniHero, amberstudent, local agencies | referral fee |
| Forex / cards | Wise, 支付宝国际, 银联留学 | referral |

## Step 2 — b2b partnerships in Shanghai (you do this)
- Walk into / email Shanghai-based **留学中介 (study-abroad agencies)** and propose:
  "I send my app's students to you; you give them a discount and pay me X%."
- Same with **insurance brokers**, **flight consolidators**, **bank branches** that serve
  international students. Many already pay referrers.
- Keep it simple: a tracked link or a unique promo code per partner.

## Step 3 — Your app does the rest (already built)
- Shop tab shows partner products with your tracking link + "we earn a commission,
  no extra cost to you".
- When a student clicks Buy, they go to the partner via YOUR link → you get credited.
- Mentor bookings take a **20% platform fee** (set in `server.py` as `MENTOR_FEE_PCT`).

## Notes
- Start with 3 categories (eSIM, insurance, visa-agency) — don't sign up for everything at once.
- For China-facing payouts, 微信支付/支付宝 merchant accounts are required (see DEPLOY-CN.md).
- Replace every `YOUR_xxx_ID` placeholder in `server.py` before going live; until then the
  links are illustrative and won't track.
