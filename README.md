# Showings Made Simple

MVP web app for verified buyers to request on-demand property showings and for nearby licensed agents to accept first-come-first-serve SMS alerts.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase auth/database/storage/RLS
- Stripe Checkout for buyer showing fees
- Twilio SMS with safe mock mode for local testing
- ZIP/service-area matching for the MVP

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

The app works without credentials in demo mode. Add Supabase, Stripe, and Twilio values in `.env.local` to use live services.

## Environment variables

See `.env.example` for all keys. Keep `SMS_MOCK_MODE=true` while developing so Twilio messages are logged instead of sent.

## Supabase

Run the SQL files in order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_mvp_alignment.sql
supabase/seed/seed.sql
```

The schema includes:

- `users`
- `buyer_profiles`
- `agent_profiles`
- `showing_requests`
- `showing_assignments`
- `payments`
- `compliance_logs`
- `sms_notifications`
- `verification_documents`
- `agent_availability`
- `payouts`
- `safety_flags`
- `audit_logs`

RLS policies scope buyer, agent, and admin access. Server-side workflow routes use `SUPABASE_SERVICE_ROLE_KEY` for trusted actions such as webhooks, SMS logging, admin actions, refunds, and first-come-first-serve assignment RPCs.

## Core routes

- `/` landing page
- `/buyer/login`
- `/agent/login`
- `/buyer/onboarding`
- `/buyer/onboarding/email`
- `/buyer/onboarding/identity`
- `/buyer/onboarding/financial`
- `/buyer/onboarding/complete`
- `/agent/onboarding`
- `/buyer/dashboard`
- `/buyer/profile`
- `/agent/dashboard`
- `/buyer/showings/new`
- `/buyer/showings/[id]`
- `/agent/accept/[id]`
- `/admin`
- `/terms`

## API routes

- `POST /api/showings` creates a showing and redirects to checkout
- `POST /api/buyer/account` creates a pending buyer and sends email verification
- `POST /api/buyer/email-verification` verifies or resends the email code/link
- `POST /api/buyer/identity` stores ID, selfie, and address for review
- `POST /api/buyer/financial` stores soft-credit consent or pre-qualification letter for review
- `GET /api/stripe/checkout` starts Stripe Checkout or mock checkout
- `POST /api/stripe/webhook` marks payment complete and starts agent matching
- `POST /api/sms/notify-agents` sends SMS alerts to matching agents
- `POST /api/showings/accept` accepts a showing first-come-first-serve
- `POST /api/showings/complete` marks assigned showings complete and tracks pending earnings
- `POST /api/admin/actions` handles manual approvals, suspensions, refunds, reassignment hooks, and completion overrides

## Tests

```bash
npm test
```

The workflow test covers buyer readiness, payment-before-broadcast, eligible agent matching, first acceptance, double-acceptance prevention, admin actions, and payout release on completion.

## MVP simplifications

- Government ID, selfie, pre-qualification letter, license, and W-9 uploads are document records/placeholders for secure Supabase Storage and admin review.
- Agent license verification is manual.
- Agent payouts are tracked in `payouts`; real transfers require Stripe Connect production setup.
- Matching uses ZIP/service-area, availability toggle, required notice time, acceptance rate, and response-time ranking.
- Google Maps/Mapbox is left as a future geocoding enhancement.
- MLS data storage, MLS redistribution, IDX, VOW, MLS API, ShowingTime, lender integrations, subscriptions, and AI matching are intentionally out of scope.

## Compliance note

Showings Made Simple facilitates scheduling, payments, matching, alerts, and records. It does not replace brokerage supervision, agency disclosures, MLS/property access rules, fair housing obligations, state licensing rules, or legal advice.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
