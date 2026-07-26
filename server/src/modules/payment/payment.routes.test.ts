import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../config/env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../config/env.js')>();
  return {
    env: {
      ...actual.env,
      sepayWebhookApiKey: 'route-test-api-key',
      sepayPgSecretKey: 'route-test-secret-key',
    },
  };
});

import { createApp } from '../../app.js';

const app = createApp();

describe('SePay machine-to-machine routes', () => {
  it('xác thực webhook bằng API key thay vì yêu cầu cookie đăng nhập', async () => {
    const response = await request(app)
      .post('/api/payments/sepay/webhook')
      .set('Authorization', 'Apikey invalid')
      .send({ id: 1, transferType: 'in', transferAmount: 2_000 });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Sai API key webhook SePay.');
  });

  it('xác thực IPN bằng secret key thay vì yêu cầu cookie đăng nhập', async () => {
    const response = await request(app)
      .post('/api/payments/sepay/ipn')
      .set('X-Secret-Key', 'invalid')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Sai Secret Key IPN SePay.');
  });
});
