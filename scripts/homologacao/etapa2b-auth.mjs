// Etapa 2B — executable only in an isolated trusted environment.
// No automatic execution, no real student data, no site or Worker changes.
// Requires Node.js >=20 and @supabase/supabase-js installed separately.
// Credentials must be supplied through environment variables, never committed.
import { createClient } from '@supabase/supabase-js';

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
for (const label of ['horizonte','estrela']) {
  const email = required(`DECOLA_${label.toUpperCase()}_EMAIL`);
  const password = required(`DECOLA_${label.toUpperCase()}_PASSWORD`);
  if (password.length < 20) throw new Error('Use strong test passwords');
  const {data,error} = await admin.auth.admin.createUser({
    email, password, email_confirm:true,
    app_metadata:{decola_stage:'2b_synthetic',persona:label}
  });
  if (error) throw new Error(`Auth creation failed for ${label}: ${error.message}`);
  console.log(`Created synthetic Auth identity: ${label} (ID: ${data.user.id})`);
}
// Supply passwords and controlled test emails via a trusted secret store.
// Keep the supplied credentials in that store for subsequent sign-in tests.
// Intentionally stop here: this script does not insert into decola tables.
console.log('Auth identities created. Account/student provisioning and RLS tests require a separate controlled runner.');
