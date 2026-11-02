// Deliberately reads a tracked disconnected example, never process.env or secrets.
import fs from 'node:fs';
import { createSessions } from './security.mjs';
import { createHomologationServer } from './app.mjs';
const config=JSON.parse(fs.readFileSync(new URL('../../environments/local.example.json',import.meta.url),'utf8'));
const server=createHomologationServer({config,sessions:createSessions()});
server.listen(config.port,config.host,()=>console.log(`Homologação LOCAL DESCONECTADA: ${config.origin}/health — Auth, banco e pagamentos não conectados.`));
server.requestTimeout=10000;server.headersTimeout=10000;
