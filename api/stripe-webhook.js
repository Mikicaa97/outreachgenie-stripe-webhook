import Stripe from "stripe";
import { buffer } from "micro";
import { supabase } from "../../supabase.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Obrada događaja
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const priceId = session.metadata.price_id;

    let newPlan = "free";
    if (priceId === process.env.STRIPE_PRO_PRICE_ID) newPlan = "pro";
    if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) newPlan = "agency";
    if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) newPlan = "enterprise";

    // ✅ Update korisničkog plana u Supabase
    await supabase
      .from("user_profiles")
      .update({ plan: newPlan })
      .eq("id", userId);
  }

  res.status(200).json({ received: true });
}
