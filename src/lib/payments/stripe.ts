import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripeClient = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      // Use the library's default apiVersion to avoid TS union mismatches
    })
  : null;









