const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport for a portrait pamphlet (like A4 or A5 proportions but mobile friendly width)
  // Also use deviceScaleFactor for HD imaging
  await page.setViewport({
    width: 600,
    height: 900,
    deviceScaleFactor: 3, // High DPI
  });

  const files = ['delivery_partner_pamphlet_en.html', 'delivery_partner_pamphlet_ta.html'];

  for (const file of files) {
    const filePath = `file:///${path.resolve(__dirname, file).replace(/\\/g, '/')}`;
    console.log(`Loading ${filePath}...`);
    await page.goto(filePath, { waitUntil: 'networkidle0' });
    
    const imageName = file.replace('.html', '.png');
    const imagePath = path.resolve(__dirname, imageName);
    
    // We will capture only the pamphlet container for a better look, or just the full page if standard
    const element = await page.$('.relative.w-full.max-w-md');
    if (element) {
        await element.screenshot({ path: imagePath, omitBackground: true });
        console.log(`Saved screenshot to ${imagePath}`);
    } else {
        await page.screenshot({ path: imagePath, fullPage: true });
        console.log(`Saved full page screenshot to ${imagePath}`);
    }
  }

  await browser.close();
  console.log('Done.');
})();
