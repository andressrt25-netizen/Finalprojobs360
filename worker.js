const jsonHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {})
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: jsonHeaders });
    }

    if (url.pathname === '/signup' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const lead = {
        id: crypto.randomUUID(),
        name: body.name || '',
        phone: body.phone || '',
        role: body.role || 'worker',
        skills: Array.isArray(body.skills) ? body.skills : ['construction labor'],
        createdAt: new Date().toISOString()
      };

      return json(lead);
    }

    return env.ASSETS.fetch(request);
  }
};
