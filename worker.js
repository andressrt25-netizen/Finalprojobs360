import Stripe from 'stripe';
import twilio from 'twilio';

const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS'
};

const jobStatuses = new Set(['Open', 'Assigned', 'Completed', 'Cancelled']);

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {})
    }
  });
}

function requireEnv(env, key) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return env[key];
}

function getStripe(env) {
  return new Stripe(requireEnv(env, 'STRIPE_SECRET_KEY'), {
    apiVersion: '2025-02-24.acacia',
    httpClient: Stripe.createFetchHttpClient()
  });
}

function getTwilio(env) {
  return twilio(requireEnv(env, 'TWILIO_ACCOUNT_SID'), requireEnv(env, 'TWILIO_AUTH_TOKEN'));
}

async function readJson(request) {
  return request.json().catch(() => ({}));
}

async function sendSmsAlert(env, to, body) {
  if (!to || !env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    return null;
  }

  return getTwilio(env).messages.create({
    from: env.TWILIO_FROM_NUMBER,
    to,
    body
  });
}

async function createSignup(request, env) {
  const body = await readJson(request);
  const lead = {
    id: crypto.randomUUID(),
    name: body.name || '',
    phone: body.phone || '',
    role: body.role || 'worker',
    skills: Array.isArray(body.skills) ? body.skills : ['construction labor'],
    createdAt: new Date().toISOString()
  };

  await env.DB.prepare(
    'INSERT INTO users (id, name, phone, role, skills, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
    .bind(lead.id, lead.name, lead.phone, lead.role, JSON.stringify(lead.skills), lead.createdAt)
    .run();

  return json(lead, { status: 201 });
}

async function createJob(request, env) {
  const body = await readJson(request);
  const job = {
    id: crypto.randomUUID(),
    employerId: body.employerId || null,
    workerId: body.workerId || null,
    title: body.title || 'Construction labor shift',
    description: body.description || '',
    payCents: Number(body.payCents || 0),
    status: 'Open',
    createdAt: new Date().toISOString()
  };

  await env.DB.prepare(
    `INSERT INTO jobs
      (id, employer_id, worker_id, title, description, pay_cents, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      job.id,
      job.employerId,
      job.workerId,
      job.title,
      job.description,
      job.payCents,
      job.status,
      job.createdAt,
      job.createdAt
    )
    .run();

  return json(job, { status: 201 });
}

async function listJobs(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, employer_id, worker_id, title, description, pay_cents, status, created_at, updated_at FROM jobs ORDER BY created_at DESC'
  ).all();

  return json({ jobs: results || [] });
}

async function createEscrowPayment(request, env) {
  const body = await readJson(request);
  const stripe = getStripe(env);
  const amount = Number(body.amountCents);

  if (!body.jobId || !amount || !body.currency || !body.workerStripeAccountId) {
    return json({ error: 'jobId, amountCents, currency, and workerStripeAccountId are required' }, { status: 400 });
  }

  const paymentId = crypto.randomUUID();
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: body.currency,
    capture_method: 'automatic',
    metadata: {
      jobId: body.jobId,
      paymentId,
      flow: 'separate_charge_and_transfer'
    }
  });

  await env.DB.prepare(
    `INSERT INTO escrow_payments
      (id, job_id, employer_id, worker_id, worker_stripe_account_id, amount_cents, currency, status, stripe_payment_intent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      paymentId,
      body.jobId,
      body.employerId || null,
      body.workerId || null,
      body.workerStripeAccountId,
      amount,
      body.currency,
      'requires_payment',
      paymentIntent.id,
      new Date().toISOString(),
      new Date().toISOString()
    )
    .run();

  await sendSmsAlert(env, body.employerPhone, `ProJobs360: escrow hold started for job ${body.jobId}.`);

  return json({
    paymentId,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status
  }, { status: 201 });
}

async function releaseEscrowFunds(env, jobId) {
  const stripe = getStripe(env);
  const escrow = await env.DB.prepare(
    `SELECT ep.*, u.phone AS worker_phone
      FROM escrow_payments ep
      LEFT JOIN users u ON u.id = ep.worker_id
      WHERE ep.job_id = ? AND ep.status IN ('held', 'payment_succeeded')
      ORDER BY ep.created_at DESC LIMIT 1`
  )
    .bind(jobId)
    .first();

  if (!escrow) {
    return null;
  }

  const transfer = await stripe.transfers.create({
    amount: escrow.amount_cents,
    currency: escrow.currency,
    destination: escrow.worker_stripe_account_id,
    metadata: {
      jobId,
      escrowPaymentId: escrow.id
    }
  });

  await env.DB.batch([
    env.DB.prepare(
      `UPDATE escrow_payments
        SET status = 'released', stripe_transfer_id = ?, released_at = ?, updated_at = ?
        WHERE id = ?`
    ).bind(transfer.id, new Date().toISOString(), new Date().toISOString(), escrow.id),
    env.DB.prepare(
      `INSERT INTO payment_events (id, escrow_payment_id, stripe_event_id, type, payload, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      escrow.id,
      null,
      'escrow.released',
      JSON.stringify({ transferId: transfer.id, jobId }),
      new Date().toISOString()
    )
  ]);

  await sendSmsAlert(env, escrow.worker_phone, `ProJobs360: escrow funds released for job ${jobId}.`);

  return { escrowPaymentId: escrow.id, transferId: transfer.id };
}

async function updateJobStatus(request, env, jobId) {
  const body = await readJson(request);
  const status = body.status;

  if (!jobStatuses.has(status)) {
    return json({ error: 'Invalid job status' }, { status: 400 });
  }

  await env.DB.prepare('UPDATE jobs SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, new Date().toISOString(), jobId)
    .run();

  let escrowRelease = null;
  if (status === 'Completed') {
    escrowRelease = await releaseEscrowFunds(env, jobId);
  }

  return json({ jobId, status, escrowRelease });
}

async function handleStripeWebhook(request, env) {
  const stripe = getStripe(env);
  const signature = request.headers.get('Stripe-Signature');
  const payload = await request.text();

  if (!signature) {
    return json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      signature,
      requireEnv(env, 'STRIPE_WEBHOOK_SECRET'),
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (error) {
    return json({ error: `Webhook signature verification failed: ${error.message}` }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const paymentId = paymentIntent.metadata?.paymentId || null;

    await env.DB.batch([
      env.DB.prepare(
        `UPDATE escrow_payments
          SET status = 'held', stripe_payment_intent_id = ?, updated_at = ?
          WHERE id = ? OR stripe_payment_intent_id = ?`
      ).bind(paymentIntent.id, new Date().toISOString(), paymentId, paymentIntent.id),
      env.DB.prepare(
        `INSERT INTO payment_events (id, escrow_payment_id, stripe_event_id, type, payload, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        crypto.randomUUID(),
        paymentId,
        event.id,
        event.type,
        payload,
        new Date().toISOString()
      )
    ]);

    const escrow = paymentId
      ? await env.DB.prepare(
        `SELECT ep.job_id, u.phone AS employer_phone
          FROM escrow_payments ep
          LEFT JOIN users u ON u.id = ep.employer_id
          WHERE ep.id = ?`
      ).bind(paymentId).first()
      : null;

    await sendSmsAlert(env, escrow?.employer_phone, `ProJobs360: payment confirmed and funds are held for job ${escrow?.job_id || ''}.`);
  }

  return json({ received: true });
}

export { releaseEscrowFunds, sendSmsAlert };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: jsonHeaders });
    }

    try {
      if (url.pathname === '/signup' && request.method === 'POST') {
        return createSignup(request, env);
      }

      if (url.pathname === '/jobs' && request.method === 'POST') {
        return createJob(request, env);
      }

      if (url.pathname === '/jobs' && request.method === 'GET') {
        return listJobs(env);
      }

      const jobStatusMatch = url.pathname.match(/^\/jobs\/([^/]+)\/status$/);
      if (jobStatusMatch && request.method === 'PATCH') {
        return updateJobStatus(request, env, jobStatusMatch[1]);
      }

      if (url.pathname === '/payments/escrow' && request.method === 'POST') {
        return createEscrowPayment(request, env);
      }

      if (url.pathname === '/stripe/webhook' && request.method === 'POST') {
        return handleStripeWebhook(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: error.message }, { status: 500 });
    }
  }
};
