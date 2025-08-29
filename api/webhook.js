import { buffer } from 'micro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: {
    bodyParser: false,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Supabase klijent
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // moraš koristiti service role key!
)

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

    // ✅ Ažuriraj plan u Supabase kada je checkout uspešan
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const userId = session.metadata?.userId
      const priceId = session.display_items?.[0]?.price?.id || session.items?.[0]?.price?.id

      let newPlan = 'pro'

      if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        newPlan = 'pro'
      } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
        newPlan = 'agency'
      } else if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
        newPlan = 'enterprise'
      }

      if (userId) {
        const { error } = await supabase
          .from('user_profiles')
          .update({ plan: newPlan })
          .eq('id', userId)

        if (error) {
          console.error('❌ Greška pri ažuriranju plana:', error)
        } else {
          console.log(`✅ Plan za korisnika ${userId} ažuriran na ${newPlan}`)
        }
      }
    }

    res.status(200).json({ received: true })
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
