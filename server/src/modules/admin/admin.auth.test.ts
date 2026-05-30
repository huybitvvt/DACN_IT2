import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signToken, AUTH_COOKIE } from '../../utils/jwt.js';

const app = createApp();

// Property 4: mọi route /api/admin yêu cầu vai trò ADMIN.
describe('Admin authorization (Property 4)', () => {
  it('401 khi chưa đăng nhập', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('403 khi là LEARNER', async () => {
    const token = signToken({ sub: 'u1', role: 'LEARNER' });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', `${AUTH_COOKIE}=${token}`);
    expect(res.status).toBe(403);
  });

  it('cho phép truy cập khi là ADMIN (không 401/403)', async () => {
    const token = signToken({ sub: 'admin1', role: 'ADMIN' });
    const res = await request(app)
      .get('/api/admin/users')
      .set('Cookie', `${AUTH_COOKIE}=${token}`);
    // Có thể 200 (nếu DB sẵn sàng) nhưng chắc chắn KHÔNG bị chặn quyền.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('403 khi LEARNER cố tạo khoá học (POST)', async () => {
    const token = signToken({ sub: 'u1', role: 'LEARNER' });
    const res = await request(app)
      .post('/api/admin/courses')
      .set('Cookie', `${AUTH_COOKIE}=${token}`)
      .send({ slug: 'x', title: 'X', language: 'PYTHON' });
    expect(res.status).toBe(403);
  });
});
