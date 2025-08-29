// api/create-checkout-session.js

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription', // ili 'payment' ako nije pretplata
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_1YourStripePriceID', // OVDE stavi tvoj tačan Price ID iz Stripe-a
          quantity: 1,
        },
      ],
      success_url: 'https://tvojfrontend.vercel.app/success',
      cancel_url: 'https://tvojfrontend.vercel.app/cancel',
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('❌ Stripe error:', err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
