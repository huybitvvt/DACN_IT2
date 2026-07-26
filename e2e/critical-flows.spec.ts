import { expect, test, type Page, type TestInfo } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Mật khẩu').fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
  });
}

test('chatbot phân biệt câu lệnh Python đúng và sai', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Mở trợ lý AI' }).click();

  const input = page.getByLabel('Nhập câu hỏi cho trợ lý AI');
  await input.fill(`print'("Hello, World!")`);
  await page.getByRole('button', { name: 'Gửi' }).click();
  await expect(page.getByText('Đoạn code này sai cú pháp Python.')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Cách đúng: `print("Hello, World!")`.')).toBeVisible();

  await input.fill('print("Hello, World!")');
  await page.getByRole('button', { name: 'Gửi' }).click();
  await expect(page.getByText('Đoạn code này đúng cú pháp Python.')).toBeVisible({
    timeout: 10_000,
  });
});

test('học viên xem gói cứu nhịp và trung tâm thông báo', async ({ page }, testInfo) => {
  await login(page, 'roi.nhip@lpp.local', 'hocvien123');

  await page.goto('/retention');
  await expect(page.getByRole('heading', { name: 'Kế hoạch chống bỏ học hôm nay' })).toBeVisible();
  await expect(page.getByText('Nguy cơ bỏ nhịp cao')).toBeVisible();
  await expect(page.getByText('Gói cứu nhịp 48 giờ', { exact: true })).toBeVisible();
  await expect(page.getByText(/Vì sao hệ thống tính \d+ điểm\?/)).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, 'retention');

  await page.goto('/notifications');
  await expect(page.getByRole('heading', { name: 'Hoạt động cần chú ý' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Thông báo qua email' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('admin xem Code DNA và dashboard can thiệp sớm', async ({ page }, testInfo) => {
  await login(page, 'admin@lpp.local', 'admin12345');

  await page.goto('/learning-profile');
  await expect(page.getByRole('heading', { name: 'Hồ sơ lỗi lập trình' })).toBeVisible();
  await expect(page.getByText('Kết quả sai', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ưu tiên luyện tập' })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto('/admin/retention');
  await expect(page.getByRole('heading', { name: 'Học viên có nguy cơ rơi nhịp' })).toBeVisible();
  await expect(page.getByText('Minh Rơi Nhịp')).toBeVisible();
  await expect(page.getByText('An Cần Theo Dõi')).toBeVisible();
  await expect(page.getByText('Linh Giữ Nhịp')).toBeVisible();
  await expect(page.getByRole('button', { name: /Giao gói cứu nhịp 48 giờ|Đã có gói đang chạy/ }).first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await capture(page, testInfo, 'admin-retention');
});
