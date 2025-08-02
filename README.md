# Stripe Webhook za OutreachGenie (Vercel)

Ova funkcija služi da automatski menja korisnikov plan u bazi (Supabase) nakon uspešnog Stripe Checkout-a.

## 📦 Instalacija

1. Kloniraj repozitorijum
2. Popuni `.env` fajl prema `.env.example`
3. Deployuj na Vercel (koristi Vercel CLI ili GitHub integraciju)
4. U Stripe podešavanjima dodaj webhook:
   - URL: `https://tvoj-vercel-url/api/stripe-webhook`
   - Events: `checkout.session.completed`

## 🔐 Environment variables

- `STRIPE_SECRET_KEY` – tvoj Stripe secret key
- `STRIPE_WEBHOOK_SECRET` – iz webhook podešavanja
- `SUPABASE_URL` – tvoj Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` – **service role key** iz Supabase

## ✅ Funkcionalnost

Kada neko uspešno izvrši plaćanje:
- Stripe šalje `checkout.session.completed` event
- Ova funkcija uzima `client_reference_id` kao `user_id`
- Plan korisnika u `user_profiles` se automatski ažurira
