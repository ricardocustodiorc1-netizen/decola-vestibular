const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for(const mode of ['quota','silent']) {
   const page=await browser.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/demonstracao.html');
   await page.getByRole('link',{name:'Experimentar demonstração',exact:true}).click();
   await page.getByRole('button',{name:'Ir para o diagnóstico'}).click();
   for(const area of ['linguagens','humanas','natureza','matematica','redacao'])await page.locator(`input[name=${area}]`).first().check();
   await page.getByRole('button',{name:'Ver meu resultado'}).click();
   await page.getByRole('link',{name:'Ver meu plano de estudos'}).click();
   await page.evaluate(mode=>{
    window.originalSetItem=Storage.prototype.setItem;
    Storage.prototype.setItem=function(key,value){
     if(key==='decola-vestibular:progress:v1'){
      if(mode==='quota')throw new DOMException('Sem espaço','QuotaExceededError');
      return;
     }
     return window.originalSetItem.call(this,key,value);
    };
   },mode);
   await page.locator('.done input').first().check();
   await page.locator('[data-storage-warning]').waitFor();
   assert.match(await page.locator('[data-storage-warning]').innerText(),/Salvamento automático indisponível/);
   assert.equal(await page.locator('.done input').first().isChecked(),true,'Falha não perde alterações em memória');
   await page.getByRole('button',{name:'💾 Salvar meu progresso',exact:true}).click();
   const backup=JSON.parse(await page.locator('#progress-copy').inputValue());
   assert.deepEqual(backup.completed,[1],'Backup manual contém mudanças mesmo se armazenamento falhar');
   await page.getByRole('button',{name:'Fechar cópia de segurança'}).click();
   await page.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
   await page.locator('.done input').nth(1).check();
   assert.equal(await page.locator('[data-storage-warning]').count(),0,'Aviso desaparece após gravação confirmada');
   await page.reload();
   await page.locator('.session').first().waitFor();
   assert.equal(await page.locator('.done input').first().isChecked(),true);
   assert.equal(await page.locator('.done input').nth(1).isChecked(),true);
   assert.deepEqual(errors,[]);
   console.log(`PASS: ${mode}: falha de escrita detectada, backup preservado, retomada do salvamento e restauração após F5.`);
   await page.close();
  }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
