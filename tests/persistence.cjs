const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const KEY = 'decola-vestibular:progress:v1';
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for (const file of ['index.html','demonstracao.html']) for (const mobile of [false,true]) {
   const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000}});
   const page = await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const read = () => page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
   await page.goto(`http://127.0.0.1:8000/${file}`);
   await page.getByRole('link',{name:'Começar meu Plano de Aprovação'}).click();
   await page.locator('[name=name]').selectOption('Estudante Estrela');
   await page.locator('[name=course]').selectOption('Engenharia');
   await page.locator('[name=days]').selectOption('3');
   await page.locator('[name=hours]').selectOption('2');
   await page.reload();
   await page.locator('#profile-form').waitFor();
   assert.equal(await page.locator('[name=name]').inputValue(),'Estudante Estrela');
   assert.equal(await page.locator('[name=course]').inputValue(),'Engenharia');
   await page.getByRole('button',{name:'Ir para o diagnóstico'}).click();
   await page.locator('input[name=linguagens][value="1"]').check();
   await page.reload();
   await page.locator('#diagnostic-form').waitFor();
   assert.equal(await page.locator('input[name=linguagens][value="1"]').isChecked(),true);
   await page.getByRole('button',{name:'Ver meu resultado'}).click();
   assert.equal(await page.locator('#diagnostic-form').count(),1);
   for(const [area,value] of Object.entries({humanas:2,natureza:0,matematica:0,redacao:2}))await page.locator(`input[name=${area}][value="${value}"]`).check();
   await page.getByRole('button',{name:'Ver meu resultado'}).click();
   await page.reload();
   await page.getByRole('heading',{name:'Seu resultado demonstrativo'}).waitFor();
   assert.equal((await read()).result.score,4);
   await page.getByRole('link',{name:'Ver meu plano de estudos'}).click();
   await page.locator('.done input').first().check();
   const saved = await read();
   assert.equal(saved.plan.sessions.length,3);
   assert.equal(saved.plan.weeklyHours,6);
   assert.deepEqual(saved.completed,[1]);
   await page.reload();
   await page.locator('.session').first().waitFor();
   assert.equal(await page.locator('.done input').first().isChecked(),true);
   assert.deepEqual(await read(),saved);
   assert.match(await page.locator('h1').innerText(),/Estrela/);
   await page.locator('.done input').first().uncheck();
   await page.reload();
   assert.equal(await page.locator('.done input').first().isChecked(),false);
   // Fechar a aba e abrir novamente também recupera a etapa salva.
   await page.close();
   const reopened = await context.newPage();
   await reopened.goto(`http://127.0.0.1:8000/${file}`);
   await reopened.locator('.session').first().waitFor();
   await reopened.evaluate(()=>localStorage.setItem('outro-app','preservar'));
   await reopened.getByRole('button',{name:'Recomeçar demonstração'}).click();
   assert.equal(await reopened.evaluate(key=>localStorage.getItem(key),KEY),null);
   assert.equal(await reopened.evaluate(()=>localStorage.getItem('outro-app')),'preservar');
   await reopened.reload();
   await reopened.locator('#profile-form').waitFor();
   assert.equal(await reopened.locator('[name=name]').inputValue(),'Estudante Aurora');
   await reopened.evaluate(key=>localStorage.setItem(key,'{invalido'),KEY);
   await reopened.reload();
   await reopened.locator('#profile-form').waitFor();
   assert.deepEqual(errors,[]);
   console.log(`PASS: ${file}, ${mobile?'celular':'desktop'}: F5 no perfil, respostas parciais, resultado e plano; marcar/desmarcar; reabrir aba; apagar somente progresso; dados corrompidos`);
   await context.close();
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
