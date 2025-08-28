import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false, // Stripe traži raw body za verifikaciju potpisa
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
    console.error("❌ Greška:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // ✅ Rukovanje Stripe eventima
  switch (event.type) {
    case "checkout.session.completed":
      console.log("💰 Plaćanje uspešno:", event.data.object);
      break;
    case "customer.subscription.updated":
      console.log("🔄 Pretplata promenjena:", event.data.object);
      break;
    case "customer.subscription.deleted":
      console.log("❌ Pretplata otkazana:", event.data.object);
      break;
    default:
      console.log(`ℹ️ Nepoznat event: ${event.type}`);
  }

  res.status(200).send("OK");
}

// Pomoćna funkcija za raw body
import { Readable } from "stream";
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}
