const checks = [
  ['frontend', 'http://localhost:5173'],
  ['backend', 'http://localhost:4000/api/health'],
  ['judge0', 'http://localhost:2358/languages'],
  ['llama', 'http://localhost:8080/health'],
];

let failed = false;
let backendReady = false;
for (const [name, url] of checks) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const ok = response.ok;
    console.log(`${name.padEnd(10)} ${ok ? 'OK' : `HTTP ${response.status}`} ${url}`);
    failed ||= !ok;
    if (name === 'backend') backendReady = ok;
  } catch (error) {
    console.log(`${name.padEnd(10)} ERROR ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
  }
}

if (backendReady) {
  const email = process.env.DEMO_ADMIN_EMAIL || 'admin@lpp.local';
  const password = process.env.DEMO_ADMIN_PASSWORD || 'admin12345';

  try {
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!loginResponse.ok) {
      throw new Error(`đăng nhập trả HTTP ${loginResponse.status}`);
    }

    const setCookies = loginResponse.headers.getSetCookie?.() || [];
    const rawCookie = setCookies[0] || loginResponse.headers.get('set-cookie');
    if (!rawCookie) throw new Error('backend không trả auth cookie');
    const cookie = rawCookie.split(';', 1)[0];

    const workflowChecks = [
      ['notifications', '/api/notifications', (data) => Array.isArray(data.notifications)],
      ['retention', '/api/retention/plan', (data) => Number.isFinite(data.healthScore)],
      [
        'error-profile',
        '/api/learning/error-profile',
        (data) => Number.isFinite(data.summary?.totalSubmissions),
      ],
      ['admin-risk', '/api/admin/retention-risks', (data) => Array.isArray(data.learners)],
    ];

    for (const [name, path, validate] of workflowChecks) {
      const response = await fetch(`http://localhost:4000${path}`, {
        headers: { cookie },
        signal: AbortSignal.timeout(15_000),
      });
      const data = response.ok ? await response.json() : null;
      const ok = response.ok && validate(data);
      console.log(`${name.padEnd(13)} ${ok ? 'OK' : `FAILED HTTP ${response.status}`} ${path}`);
      failed ||= !ok;
    }

    const webhookProbe = await fetch('http://localhost:4000/api/payments/sepay/webhook', {
      method: 'POST',
      headers: {
        authorization: 'Apikey intentionally-invalid',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ id: 0, transferType: 'in', transferAmount: 0 }),
      signal: AbortSignal.timeout(15_000),
    });
    const webhookError = await webhookProbe.json();
    const webhookRouteOk =
      webhookProbe.status === 401 && webhookError.error?.message === 'Sai API key webhook SePay.';
    console.log(
      `${'sepay-route'.padEnd(13)} ${webhookRouteOk ? 'OK' : `FAILED HTTP ${webhookProbe.status}`} /api/payments/sepay/webhook`,
    );
    failed ||= !webhookRouteOk;
  } catch (error) {
    console.log(
      `${'workflows'.padEnd(13)} ERROR ${error instanceof Error ? error.message : String(error)}`,
    );
    failed = true;
  }
}

process.exitCode = failed ? 1 : 0;
