// api/webhook.js

import { buffer } from 'micro'
import Stripe from 'stripe'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['stripe-signature']

    let event

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } catch (err) {
      console.error('❌ Webhook Error:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // Primer: reaguj na uspešnu pretplatu
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      console.log('✅ Checkout session completed:', session)

      // Update user plana u Supabase (dodaj ovde svoju logiku)
    }

    res.status(200).json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
