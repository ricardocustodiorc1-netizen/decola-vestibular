// Execute com Playwright instalado: node tests/browser.cjs
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
 try {
  for (const mobile of [false, true]) for (const mode of ['http', 'iframe', 'iframe-without-forms']) {
   const page = await browser.newPage({ viewport: mobile ? {width:390,height:844} : {width:1440,height:1000} });
   const embedded = mode !== 'http';
   const errors=[];
   const blockedSubmissions=[];
   page.on('console', message => { if(message.text().includes('Blocked form submission')) blockedSubmissions.push(message.text()); });
   page.on('pageerror',e=>errors.push(e.message));
   let frame=page;
   if (embedded) {
    await page.setContent(`<iframe sandbox="${mode === 'iframe' ? 'allow-scripts allow-forms' : 'allow-scripts'}" style="width:100%;height:800px"></iframe>`);
    const html=readFileSync(resolve(__dirname,'../demonstracao.html'),'utf8');
    await page.locator('iframe').evaluate((el,html)=>el.srcdoc=html,html);
    frame=page.frameLocator('iframe');
   } else await page.goto('http://127.0.0.1:8000/');
   await frame.getByRole('link',{name:'Experimentar demonstração',exact:true}).click();
   await frame.locator('[name=days]').selectOption('3');
   await frame.locator('[name=hours]').selectOption('2');
   await frame.getByRole('button',{name:'Ir para o diagnóstico'}).click();
   await frame.locator('#diagnostic-form').waitFor();
   assert.equal(await frame.locator('.question').count(),5,'Abre as cinco questões');
   await frame.getByRole('button',{name:'Ver meu resultado'}).click();
   assert.equal(await frame.locator('#diagnostic-form').count(),1,'Não permite questões em branco');
   for(const [area,value] of Object.entries({linguagens:1,humanas:2,natureza:0,matematica:0,redacao:2})) await frame.locator(`input[name=${area}][value="${value}"]`).check();
   await frame.getByRole('button',{name:'Ver meu resultado'}).click();
   await frame.getByRole('heading',{name:'Seu resultado demonstrativo'}).waitFor();
   assert.equal(await frame.locator('.feedback').count(),5);
   await frame.getByRole('link',{name:'Ver meu plano de estudos'}).click();
   await frame.locator('.session').first().waitFor();
   assert.equal(await frame.locator('.session').count(),3);
   assert.match(await frame.locator('.stats').innerText(),/6h/);
   assert.match(await frame.locator('.stats').innerText(),/4\/5/);
   assert.match(await frame.locator('.session').first().innerText(),/Matemática/);
   await frame.locator('.done input').first().check();
   assert.equal(await frame.locator('.done input').first().isChecked(),true);
   assert.equal(await frame.locator('main').evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await frame.getByRole('button',{name:'Recomeçar demonstração'}).click();
   await frame.locator('#profile-form').waitFor();
   if (embedded) assert.equal(await frame.locator('[data-storage-warning]').count(),1,'Avisa quando iframe bloqueia localStorage');
   assert.deepEqual(errors,[]);
   assert.deepEqual(blockedSubmissions,[]);
   console.log(`PASS: ${mobile?'celular':'desktop'}, ${mode}: perfil → diagnóstico → resultado → plano → recomeçar`);
   await page.close();
  }
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
