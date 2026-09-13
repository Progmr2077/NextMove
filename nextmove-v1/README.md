# NextMove V1

NextMove is a static, browser-first goal planning app. V1 includes:

- Professional landing page
- Guided goal creation wizard
- Goal templates for career, money, education, projects and personal goals
- Priority scoring / next-best-action planner
- Progress tracking
- LocalStorage persistence
- Dark mode
- Responsive mobile/desktop UI
- Stripe Payment Link placeholder for a future Pro plan

## Run locally

No build step is required.

Option A: open `index.html` directly in a browser.

Option B (recommended): from this folder run:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Configure payments

1. Create a Stripe account.
2. Create a Pro product/subscription and a Stripe Payment Link.
3. Open `config.js`.
4. Set:

```js
STRIPE_PRO_PAYMENT_LINK: "https://buy.stripe.com/YOUR_LINK"
```

Do not put secret Stripe keys in this project.

### Important

This V1 redirects users to Stripe but does **not** securely verify paid status or enforce a server-side subscription. A real paid SaaS should add authentication + database + webhook verification before treating a user as Pro.

## Deploying

For a commercial product, do not use GitHub Pages as the production host. GitHub's current documentation says GitHub Pages is not intended/allowed to run an online business or commercial SaaS. Cloudflare Pages supports static HTML deployment and has a Free plan; it can deploy from GitHub or by direct upload.

Recommended early path:

```text
GitHub repository
      ↓
Cloudflare Pages
      ↓
Custom domain later
```

## Suggested V2 stack

- Frontend: HTML/CSS/JavaScript (later TypeScript if desired)
- Backend/auth: Supabase
- Database: Supabase Postgres
- Payments: Stripe
- Mobile: Capacitor + Android Studio / Xcode later

## Suggested monetization

Free:
- 3 active goals
- Planner
- Progress tracking
- Local storage

Pro:
- Unlimited goals
- Cloud sync
- Advanced analytics
- Recurring goals
- AI planning

Suggested early price: CA$4.99/month or an annual discount.

## Disclaimer

NextMove is a productivity/planning tool. Its calculations are estimates and are not financial, medical, legal, employment, or professional advice.
