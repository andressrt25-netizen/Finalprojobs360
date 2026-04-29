# Finalprojobs360
Finalprojobs360 is the final product of projobs360

## Development

Install dependencies:

```sh
npm install
```

Run the local API:

```sh
npm start
```

The API listens on `http://localhost:3000`.

Smoke-check the server syntax:

```sh
npm test
```

Deploy to Cloudflare Workers:

```sh
npm run deploy
```

The current `workers.dev` hostname may be protected by Cloudflare Access. To make
the site public on `projobs360.com`, add Workers route edit permissions to the API
token, then add these routes to `wrangler.toml`:

```toml
routes = [
  { pattern = "projobs360.com/*", zone_name = "projobs360.com" },
  { pattern = "www.projobs360.com/*", zone_name = "projobs360.com" }
]
```

Create and migrate the production D1 database:

```sh
npx wrangler d1 create finalprojobs360-db
# Paste the returned database_id into wrangler.toml.
npm run db:migrate:local
npm run db:migrate:prod
```

Configure production secrets:

```sh
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put TWILIO_ACCOUNT_SID
npx wrangler secret put TWILIO_AUTH_TOKEN
npx wrangler secret put TWILIO_FROM_NUMBER
```
