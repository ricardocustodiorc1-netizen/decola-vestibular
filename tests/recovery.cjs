const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try {
  for (const width of [1440,390]) {
  const page=await browser.newPage({viewport:{width,height:1000}}); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const html=readFileSync(resolve(__dirname,'../demonstracao.html'),'utf8');
  const reloadPreview=async()=>{
   await page.setContent('<iframe sandbox="allow-scripts" style="width:100%;height:900px"></iframe>');
   await page.locator('iframe').evaluate((el,html)=>el.srcdoc=html,html);
   const frame=page.frameLocator('iframe');
   await frame.locator('[data-storage-warning]').waitFor();
   return frame;
  };
  let frame=await reloadPreview();
  const denied=await frame.locator('main').evaluate(()=>{try{localStorage.getItem('test');return false}catch(e){return e.name}});
  assert.equal(denied,'SecurityError');
  await frame.getByRole('link',{name:'Experimentar demonstração',exact:true}).click();
  await frame.locator('[name=name]').selectOption('Estudante Horizonte');
  await frame.locator('[name=days]').selectOption('3');
  await frame.getByRole('button',{name:'Ir para o diagnóstico'}).click();
  for(const [area,value]of Object.entries({linguagens:1,humanas:2,natureza:0,matematica:0,redacao:2}))await frame.locator(`input[name=${area}][value="${value}"]`).check();
  await frame.getByRole('button',{name:'Ver meu resultado'}).click();
  await frame.getByRole('link',{name:'Ver meu plano de estudos'}).click();
  await frame.locator('.done input').first().check();
  const saveButton = frame.getByRole('button',{name:'💾 Salvar meu progresso',exact:true});
  await saveButton.scrollIntoViewIfNeeded();
  assert.equal(await saveButton.isVisible(),true);
  await saveButton.click();
  await frame.locator('dialog[open]').waitFor();
  await frame.getByRole('button',{name:'Copiar cópia de segurança',exact:true}).click();
  assert.match(await frame.locator('#recovery-status').innerText(),/copiada|selecionado/);
  const backup=await frame.locator('#progress-copy').inputValue();
  const saved=JSON.parse(backup);assert.deepEqual(saved.completed,[1]);assert.equal(saved.result.score,4);assert.equal(saved.plan.sessions.length,3);
  frame=await reloadPreview();
  assert.equal(await frame.locator('.hero').count(),1,'Reproduz perda quando armazenamento é bloqueado');
  await frame.getByRole('button',{name:'Recuperar progresso salvo',exact:true}).click();
  await frame.locator('#progress-copy').fill(backup);
  await frame.getByRole('button',{name:'Recuperar progresso',exact:true}).click();
  await frame.locator('.session').first().waitFor();
  assert.equal(await frame.locator('.done input').first().isChecked(),true);
  assert.match(await frame.locator('h1').innerText(),/Horizonte/);
  assert.match(await frame.locator('.stats').innerText(),/4\/5/);
  await frame.getByRole('button',{name:'Fechar cópia de segurança'}).click();
  // Voltar ao início não deve iniciar um novo perfil por engano.
  await frame.getByRole('link',{name:'Decola Vestibular, início'}).click();
  await frame.getByRole('link',{name:'Experimentar demonstração',exact:true}).click();
  await frame.locator('.session').first().waitFor();
  assert.equal(await frame.locator('.done input').first().isChecked(),true);
  await frame.getByRole('button',{name:'💾 Salvar meu progresso',exact:true}).click();
  await frame.locator('#progress-copy').fill('texto inválido');
  await frame.getByRole('button',{name:'Recuperar progresso',exact:true}).click();
  assert.match(await frame.locator('#recovery-status').innerText(),/Cópia inválida/);
  assert.equal(await frame.locator('.done input').first().isChecked(),true);
  // Cópias antigas que não têm derivados devem reconstruir resultado e plano.
  delete saved.plan;delete saved.result;
  await frame.locator('#progress-copy').fill(JSON.stringify(saved));
  await frame.getByRole('button',{name:'Recuperar progresso',exact:true}).click();
  assert.equal(await frame.locator('.session').count(),3);
  assert.equal(await frame.locator('.done input').first().isChecked(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: botão visível no topo, janela de cópia e recuperação;  SecurityError real em iframe; perda após recriar prévia; cópia manual restaura perfil, respostas, resultado, plano e conclusão; início retoma plano; cópia inválida preserva sessão; derivados ausentes são reconstruídos.');
  await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
