// Etapa 2B — executable only in an isolated trusted environment.
// No automatic execution, no real student data, no site or Worker changes.
// Requires Node.js >=20 and @supabase/supabase-js installed separately.
// Credentials must be supplied through environment variables, never committed.
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const EXPECTED = 'yxxrfhobhonigwczzpim';
const URL = `https://${EXPECTED}.supabase.co`;
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
const mode = process.argv[2] ?? 'check';
if (!['check', 'create'].includes(mode)) throw new Error('Use check or create');
if (required('DECOLA_TEST_PROJECT_ID') !== EXPECTED) throw new Error('Wrong project');
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== URL) throw new Error('Wrong URL');
if (mode === 'check') {
  console.log('Stage 2B: target verified. No users created.');
  process.exit(0);
}
if (process.env.DECOLA_TEST_CREATE !== 'YES') throw new Error('Creation requires DECOLA_TEST_CREATE=YES');
const key = required('SUPABASE_SERVICE_ROLE_KEY');
const admin = createClient(URL, key, {auth:{autoRefreshToken:false,persistSession:false}});
const suffix = randomBytes(8).toString('hex');
const domain = required('DECOLA_TEST_EMAIL_DOMAIN');
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) throw new Error('Invalid controlled email domain');
const records = [];
for (const label of ['horizonte','estrela']) {
  const email = `decola-2b-${label}-${suffix}@${domain}`;
  const password = randomBytes(36).toString('base64url');
  const {data,error} = await admin.auth.admin.createUser({
    email, password, email_confirm:true,
    app_metadata:{decola_stage:'2b_synthetic',persona:label}
  });
  if (error) throw new Error(`Auth creation failed for ${label}: ${error.message}`);
  records.push({persona:label,user_id:data.user.id,email,password});
  console.log(`Created synthetic Auth identity: ${label} (ID: ${data.user.id})`);
}
// Save returned credentials only to an approved secret store, never stdout or Git.
// The runner must capture the in-memory records securely before adding DB fixtures.
// Intentionally stop here: this script does not insert into decola tables.
console.log('Auth identities created. Account/student provisioning and RLS tests require a separate controlled runner.');
