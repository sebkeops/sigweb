// Usage : node ../_commun/generate-pdf.js <input.html> <output.pdf>
const puppeteer = require('puppeteer');
const path = require('path');

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('Usage: node generate-pdf.js <input.html> <output.pdf>');
  process.exit(1);
}
const input = path.resolve(process.cwd(), inputArg);
const output = path.resolve(process.cwd(), outputArg);

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('file://' + input, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate:
      '<div style="font-size:9px;width:100%;text-align:center;color:#555;">Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>',
    margin: { top: '14mm', bottom: '16mm', left: '18mm', right: '18mm' },
  });
  await browser.close();
  console.log('PDF généré :', output);
})();
