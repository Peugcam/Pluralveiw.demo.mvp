const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('🔍 Acessando https://pluralview-mvp.vercel.app/');
  await page.goto('https://pluralview-mvp.vercel.app/', { waitUntil: 'networkidle' });

  // Wait a bit for page to fully load
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({ path: 'production-screenshot.png', fullPage: true });
  console.log('📸 Screenshot salvo em production-screenshot.png');

  // Get page title
  const title = await page.title();
  console.log('📄 Título da página:', title);

  // Check for errors in console
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Get page content
  const bodyText = await page.textContent('body');
  console.log('📝 Primeiros 500 caracteres do body:');
  console.log(bodyText.substring(0, 500));

  // Check if it's the old or new design
  const hasCircularLayout = await page.locator('text=Circular').count() > 0;
  const hasPremiumDesign = await page.locator('.glass-card').count() > 0;
  const hasOldDesign = await page.locator('.result-card').count() > 0;

  console.log('\n🎨 Análise do Design:');
  console.log('- Layout Circular (novo):', hasCircularLayout);
  console.log('- Glass Cards (novo):', hasPremiumDesign);
  console.log('- Result Cards (antigo):', hasOldDesign);

  // Try to search something
  console.log('\n🔎 Testando busca...');
  const searchInput = await page.locator('input[type="text"], textarea').first();
  if (searchInput) {
    await searchInput.fill('Inteligência Artificial');
    console.log('✅ Input de busca funcionando');

    const analyzeButton = await page.locator('button:has-text("Analisar")').first();
    if (analyzeButton) {
      console.log('✅ Botão Analisar encontrado');
    }
  }

  console.log('\n⏳ Aguardando 10 segundos para você ver a página...');
  await page.waitForTimeout(10000);

  await browser.close();
  console.log('✅ Teste concluído!');
})();
