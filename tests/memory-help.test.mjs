import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('fechamento por mudança de tela é idempotente: não repete mutações hidden',()=>{
 let observer;
 class Node{constructor(){this.children=[];this.hiddenWrites=0;this._hidden=false;}set hidden(v){this._hidden=v;this.hiddenWrites++;}get hidden(){return this._hidden;}append(...children){this.children.push(...children);}setAttribute(){}addEventListener(){}focus(){}}
 const panel=new Node(),dashboard=new Node(),host=new Node();host.isConnected=true;host.closest=selector=>selector==='.leo-panel'?panel:dashboard;panel.querySelector=()=>null;
 const sandbox={document:{createElement:()=>new Node()},DecolaMemory:{helpLimit:()=>180,items:[{hint:'dica',reference:'resolução'}]},DecolaLeoClient:{},MutationObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}}};
 vm.runInNewContext(fs.readFileSync(new URL('../memory-help.js',import.meta.url),'utf8'),sandbox);
 sandbox.DecolaMemoryHelp.mount({host,index:0,getState:()=>({status:'active'}),markSupport(){}});
 const box=host.children[1];dashboard.hidden=true;const initialWrites=box.hiddenWrites;observer();observer();assert.equal(box.hiddenWrites,initialWrites,'Já fechado: não deve emitir nova mutação');
 box.hidden=false;const before=box.hiddenWrites;observer();observer();assert.equal(box.hidden,true);assert.equal(box.hiddenWrites,before+1,'Aberto: fecha uma vez e estabiliza');
});
