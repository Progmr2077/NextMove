/*
 * NextMove configuration
 *
 * This file contains only public configuration. NEVER put secret API keys here.
 * A Stripe Payment Link is safe to expose because customers are redirected to Stripe's checkout.
 *
 * 1. Create a Stripe Payment Link for your Pro plan.
 * 2. Paste the link below.
 * 3. Leave it blank while developing.
 */
window.NEXTMOVE_CONFIG = {
  STRIPE_PRO_PAYMENT_LINK: "",
  PRO_PRICE_LABEL: "CA$4.99/month",
  APP_NAME: "NextMove"
};
