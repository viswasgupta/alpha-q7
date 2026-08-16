import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const shotsDir = path.join(root, 'test-screenshots');

const SITE = 'http://localhost:4000';
const ADMIN = 'http://localhost:5173/admin/';

async function shot(page, name) {
  await page.screenshot({ path: path.join(shotsDir, name), fullPage: false });
  console.log('Saved', name);
}

async function main() {
  await fs.mkdir(shotsDir, { recursive: true });

  const healthRes = await fetch(`${SITE}/api/health`);
  if (!healthRes.ok) throw new Error('Backend not running on port 4000');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  // 1-2 Enroll
  await page.goto(`${SITE}/#masterclass`, { waitUntil: 'networkidle' });
  await page.fill('#fullName', 'Test User');
  await page.fill('#mobile', '9000000000');
  await page.fill('#email', 'test@example.com');
  await page.selectOption('#experience', 'Beginner');
  await shot(page, '01-enroll-form-filled.png');

  const enrollWait = page.waitForResponse(r => r.url().includes('/api/leads') && r.request().method() === 'POST');
  await page.locator('#leadForm button[type="submit"]').click();
  const enrollResp = await enrollWait;
  if (!enrollResp.ok()) throw new Error(`Enroll failed: ${enrollResp.status()}`);
  await page.waitForSelector('#formSuccess:not([hidden])');
  await shot(page, '02-enroll-success.png');

  // 4-5 Brochure
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.click('#downloadBrochure');
  await page.waitForSelector('#brochureModal:not([hidden])');
  await page.fill('#brochureName', 'Test User');
  await page.fill('#brochureMobile', '9000000000');
  await page.fill('#brochureEmail', 'test@example.com');
  await page.selectOption('#brochureExperience', 'Beginner');
  await shot(page, '04-brochure-form-filled.png');

  const brochureWait = page.waitForResponse(r => r.url().includes('/api/leads') && r.request().method() === 'POST');
  await page.locator('#brochureEnquiryForm button[type="submit"]').click();
  const brochureResp = await brochureWait;
  if (!brochureResp.ok()) throw new Error(`Brochure failed: ${brochureResp.status()}`);
  await page.waitForSelector('#brochureSuccess:not([hidden])');
  await shot(page, '05-brochure-success.png');

  // 10 Why Alpha Q7
  await page.goto(`${SITE}/#why-alpha`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#whyAlphaContainer');
  await shot(page, '10-why-alpha-q7.png');

  // 11-12 Footer
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '11-footer-desktop.png');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, '12-footer-mobile.png');

  // Admin
  const admin = await context.newPage();
  await admin.goto(ADMIN, { waitUntil: 'networkidle' });
  await admin.locator('input[autocomplete="username"]').fill('admin');
  await admin.locator('input[type="password"]').fill(process.env.TEST_ADMIN_PASSWORD || '');
  await admin.locator('button[type="submit"]').click();
  await admin.waitForSelector('text=Lead Management', { timeout: 15000 });
  await admin.locator('button.nav-item', { hasText: 'Leads' }).click();
  await admin.waitForSelector('.lead-table');
  await shot(admin, '03-admin-leads-enroll.png');

  const tableText = await admin.locator('.lead-table').innerText();
  if (!tableText.includes('Test User') || !tableText.includes('9000000000')) {
    throw new Error('Website leads not visible in admin');
  }
  await shot(admin, '06-admin-leads-brochure.png');

  await admin.locator('button', { hasText: 'Enter lead' }).click();
  await admin.waitForSelector('.lead-modal-card');
  await shot(admin, '07-admin-add-lead-form.png');

  const modalInputs = admin.locator('.lead-modal-card input');
  await modalInputs.nth(0).fill('Test Admin Lead');
  await modalInputs.nth(1).fill('9876543210');
  await modalInputs.nth(2).fill('test@example.com');
  await admin.locator('.lead-modal-card select').first().selectOption('Intermediate');
  await admin.locator('button', { hasText: 'Save Lead' }).click();
  await admin.waitForTimeout(2000);
  await shot(admin, '08-admin-leads-after-manual-add.png');

  if (!(await admin.locator('.lead-table').innerText()).includes('Test Admin Lead')) {
    throw new Error('Manual admin lead not saved');
  }

  const [download] = await Promise.all([
    admin.waitForEvent('download'),
    admin.locator('button', { hasText: 'Download CSV' }).click()
  ]);
  const csvPath = path.join(shotsDir, '09-leads-export.csv');
  await download.saveAs(csvPath);
  const csv = await fs.readFile(csvPath, 'utf8');
  if (!csv.includes('Test User') || !csv.includes('Test Admin Lead')) {
    throw new Error('CSV export missing expected leads');
  }
  console.log('CSV export verified');

  // Responsive scroll check
  for (const w of [320, 375, 430, 768, 1024, 1366, 1920]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto(SITE, { waitUntil: 'domcontentloaded' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) console.warn(`Horizontal scroll detected at ${w}px`);
  }

  await browser.close();
  console.log('All tests passed.');
}

main().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
