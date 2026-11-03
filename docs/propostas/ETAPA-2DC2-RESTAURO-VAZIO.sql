-- PROPOSTA NAO EXECUTADA. Restauracao estrutural so apos aprovacao especifica.
-- Precondicao externa: executor parado, Data API decola NAO exposta, nenhum
-- recurso de fixture criado; instalador com ownership/SET ROLE necessario.
BEGIN;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM decola_guard.run_scope) THEN RAISE EXCEPTION 'Preserve inventory; separate cleanup approval required';END IF;
END $$;
CREATE OR REPLACE FUNCTION decola.active_account() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS (
  SELECT 1 FROM decola.accounts a JOIN auth.users u ON u.id=a.id
  WHERE a.id=auth.uid() AND NOT a.disabled AND u.email_confirmed_at IS NOT NULL
   AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp())
 );
$$;

DROP POLICY guard_account_read ON decola.accounts;
DROP POLICY guard_account_insert ON decola.accounts;
DROP POLICY guard_student_read ON decola.students;
DROP POLICY guard_student_insert ON decola.students;
GRANT decola_guard_owner,decola_probe_owner TO postgres WITH SET TRUE;
SET LOCAL ROLE decola_probe_owner;
DROP FUNCTION decola_guard.student_action(uuid,uuid,uuid,text,uuid);
RESET ROLE;
SET LOCAL ROLE decola_guard_owner;
DROP FUNCTION decola_guard.approved_scope(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz);
DROP FUNCTION decola_guard.provision_pair(uuid);
DROP FUNCTION decola_guard.inspect_pair(uuid);
DROP FUNCTION decola_guard.expected_student(uuid,uuid);
DROP FUNCTION decola_guard.active_session(uuid,uuid,uuid);
RESET ROLE;
DROP FUNCTION decola_guard.current_session();
DROP FUNCTION decola_guard.fixture_auth_valid(uuid,uuid);
SET LOCAL ROLE decola_guard_owner;
DROP TABLE decola_guard.run_scope;
DROP SCHEMA decola_guard;
RESET ROLE;
REVOKE USAGE ON SCHEMA decola FROM decola_probe_owner;
REVOKE CONNECT ON DATABASE postgres FROM decola_homologacao;
DROP ROLE decola_homologacao;
DROP ROLE decola_probe_owner;
DROP ROLE decola_guard_owner;
COMMIT;
-- Sem CASCADE/DROP OWNED: qualquer dependencia extra aborta toda a transacao.
