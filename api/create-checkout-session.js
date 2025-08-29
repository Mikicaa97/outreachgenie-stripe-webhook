// api/create-checkout-session.js

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { plan, userId, email } = req.body

  let priceId = ''

  switch (plan) {
    case 'pro':
      priceId = process.env.STRIPE_PRO_PRICE_ID
      break
    case 'agency':
      priceId = process.env.STRIPE_AGENCY_PRICE_ID
      break
    case 'enterprise':
      priceId = process.env.STRIPE_ENTERPRISE_PRICE_ID
      break
    default:
      return res.status(400).json({ error: 'Nepoznat plan' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?canceled=true`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe error', err)
    res.status(500).json({ error: 'Stripe greška' })
  }
}
