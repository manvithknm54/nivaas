# Nivaas

**Run a PG (paying-guest hostel) without WhatsApp polls, notebooks and phone calls.**
Rent, meals, leaves, reminders and complaints in one simple app for owners and their tenants.

**[Live demo](https://nivaas-4ymc.onrender.com)** · Built with MongoDB, Express, React and Node.js

> The demo is on a free tier, so the first load after a quiet period can take up to a minute.

---

## The problem

In my own PG, the owner counts meal votes in a WhatsApp group, tracks rent in a notebook, and tenants phone him whenever the WiFi recharge runs out. Part-payments, "I'll pay next week" and leave deductions all live in people's memories.

## The solution

One login for the owner and one for each tenant.

| Owner | Tenant |
|---|---|
| Rent ledger with part-payments, discounts and corrections | See dues and payment history, ask for more time |
| Live meal-poll counts, lock, and a message ready for the cook | Vote veg or non-veg in one tap |
| WiFi and bill expiry reminders | Declare leave and see the rent reduction instantly |
| Complaints, resolved with a required "what was done" note | Raise and track complaints |
| Invite tenants by QR code, approve them, assign rooms | Join by scanning the QR |

**Automatic:** monthly dues, rent reminders about every 5 hours (8 AM to 9 PM) until paid or extended, and in-app notifications.

## Try it in two minutes

1. Open the [live demo](https://nivaas-4ymc.onrender.com), choose **Create account, I own a PG**, and create a PG.
2. Add a room, open **Tenants**, and copy the invite link.
3. Open that link in a **private window**, register as a tenant, and request to join.
4. As the owner, approve it. Then record a payment and try Meals and Leaves.

## What makes it solid

- **Append-only rent ledger.** Payments, credits and reversals are entries. Nothing is edited or deleted, so part-payments and corrections stay auditable.
- **Idempotent monthly dues.** A unique index plus upserts means dues can never be duplicated, however many times generation runs.
- **Rules enforced on the server.** Role-based access, per-PG data isolation, and validated input. The UI is never trusted.
- **Reliable by design.** Restart-safe scheduled jobs, a startup check for missing configuration, and an error boundary so a bug never shows a blank page.
- **Tested logic.** Unit tests cover the ledger, meal polls and leave credit.

## Tech stack

React (Vite, Tailwind, TanStack Query) · Node.js and Express · MongoDB (Mongoose) · JWT in httpOnly cookies, Zod, bcrypt · node-cron · Render and MongoDB Atlas

## Run it locally

```bash
git clone https://github.com/manvithknm54/nivaas.git
cd nivaas/server
npm install
cp .env.example .env     # fill in MONGO_URI, JWT_SECRET, CLIENT_URL=http://localhost:5173
npm run dev              # API on :5000

# new terminal
cd nivaas/client
npm install
npm run dev              # app on :5173
```

Run the tests with `cd server && npm test`. Email is optional (`BREVO_API_KEY` and `MAIL_FROM`); without it, notifications are in-app only.

## AI development experience

**Code0**

**[FILL IN: one or two honest sentences on how you used Code0 in this project, including how you used its Git workspace for commits. Say only what is true.]**

| Task | What Code0 did | What I checked or fixed |
|---|---|---|
| **[FILL IN]** | **[FILL IN]** | **[FILL IN]** |
| **[FILL IN]** | **[FILL IN]** | **[FILL IN]** |
| **[FILL IN]** | **[FILL IN]** | **[FILL IN]** |

**Other AI help.** I also used Claude as a pair-programmer for design discussions and first drafts. I tested everything by hand and fixed what broke, for example a rate limiter that locked me out, a crash that left a blank screen for tenants who hadn't joined a PG, and two production deployment errors.

## Known limitations

- No proration for tenants who join mid-month; ending a leave early isn't supported yet.
- Screens refresh by polling rather than WebSockets, and there are no automated frontend or end-to-end tests yet.
- Free hosting means cold starts and no automatic database backups.

---

**Manvith Kumar N M** · [GitHub](https://github.com/manvithknm54) · [LinkedIn](https://linkedin.com/in/manvith-kumar-n-m-b5a955363)
