const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('--- Inspecting Frontend ---');
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQUEST FAILED:', req.url(), req.failure().errorText));

  try {
    await page.goto('https://diperma.github.io/app-tw2/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'frontend_screenshot.png' });
    console.log('Frontend loaded.');
  } catch (e) {
    console.log('Failed to load frontend:', e.message);
  }

  console.log('\n--- Inspecting Backend API ---');
  try {
    const response = await page.goto('https://app-tw2.vercel.app/api/provinces');
    console.log('Backend Status:', response.status());
    const text = await response.text();
    console.log('Backend Body:', text.substring(0, 200));
  } catch (e) {
    console.log('Failed to load backend:', e.message);
  }

  await browser.close();
})();
