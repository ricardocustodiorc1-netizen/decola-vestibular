import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';

test('bibliotecas reais importam com rede bloqueada e versões fixas instaladas',async()=>{
 const connect=net.Socket.prototype.connect,fetch=globalThis.fetch;
 net.Socket.prototype.connect=function(){throw Error('NETWORK_FORBIDDEN_DURING_IMPORT');};
 globalThis.fetch=()=>{throw Error('NETWORK_FORBIDDEN_DURING_IMPORT');};
 try{
  const supabase=await import('@supabase/supabase-js'),pg=await import('pg');
  assert.equal(typeof supabase.createClient,'function');assert.equal(typeof pg.default.Pool,'function');
  const manifest=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url)));
  for(const name of ['@supabase/supabase-js','pg']){
   const installed=JSON.parse(fs.readFileSync(new URL('../node_modules/'+name+'/package.json',import.meta.url)));
   assert.equal(installed.version,manifest.dependencies[name]);
  }
 }finally{net.Socket.prototype.connect=connect;globalThis.fetch=fetch;}
});
test('lockfile contém resoluções HTTPS e integridade para todos os pacotes instaláveis',()=>{
 const lock=JSON.parse(fs.readFileSync(new URL('../package-lock.json',import.meta.url)));
 assert.equal(lock.lockfileVersion,3);
 for(const [path,entry]of Object.entries(lock.packages)){
  if(!path)continue;
  assert.match(entry.integrity,/^sha512-/);const resolved=new URL(entry.resolved);
  assert.equal(resolved.protocol,'https:');assert.equal(resolved.hostname,'registry.npmjs.org');assert.equal(resolved.username,'');assert.equal(resolved.password,'');
 }
});

test('parser real pg aceita override de host em query; guarda do executor deve rejeitá-lo',async()=>{
 const {parse}=await import('pg-connection-string');
 const parsed=parse('postgresql://fixture:NOT_A_PASSWORD@db.yxxrfhobhonigwczzpim.supabase.co/postgres?host=attacker.invalid');
 assert.equal(parsed.host,'attacker.invalid');
});
