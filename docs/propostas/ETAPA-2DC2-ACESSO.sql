-- PROPOSTA EXATA, NAO EXECUTADA. Revisar/aprovar apenas yxxrfhobhonigwczzpim.
-- Precondicoes: estrutura 2A intacta, roles/schema abaixo ausentes, Auth acessivel
-- por funcoes booleanas privadas do dono de active_account (sem policies Auth).
BEGIN;
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='decola_homologacao')
 THEN RAISE EXCEPTION 'Prior role must be absent; do not widen existing role'; END IF;
END $$;
CREATE ROLE decola_guard_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE decola_probe_owner NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE decola_homologacao LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2 PASSWORD NULL;
GRANT decola_guard_owner TO postgres WITH INHERIT FALSE;
GRANT decola_guard_owner TO postgres WITH SET TRUE;
GRANT decola_probe_owner TO postgres WITH INHERIT FALSE;
GRANT decola_probe_owner TO postgres WITH SET TRUE;
CREATE SCHEMA decola_guard AUTHORIZATION decola_guard_owner;
SET LOCAL ROLE decola_guard_owner;
REVOKE ALL ON SCHEMA decola_guard FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA decola_guard TO decola_homologacao,decola_probe_owner,postgres;
RESET ROLE;
GRANT CONNECT ON DATABASE postgres TO decola_homologacao;
ALTER ROLE decola_homologacao SET statement_timeout='5s';
ALTER ROLE decola_homologacao SET lock_timeout='2s';
ALTER ROLE decola_homologacao SET idle_in_transaction_session_timeout='10s';
GRANT USAGE ON SCHEMA decola TO decola_guard_owner,decola_probe_owner;
GRANT EXECUTE ON FUNCTION decola.active_account() TO decola_guard_owner;
GRANT SELECT(id,disabled),INSERT(id) ON decola.accounts TO decola_guard_owner;
GRANT SELECT(id,account_id,eligibility_key),INSERT(id,account_id,eligibility_key) ON decola.students TO decola_guard_owner;
-- Somente o dono NOLOGIN da sonda herda authenticated; o login executor NAO.
GRANT authenticated TO decola_probe_owner WITH INHERIT TRUE;
GRANT authenticated TO decola_probe_owner WITH SET FALSE;
GRANT authenticated TO decola_probe_owner WITH ADMIN FALSE;
SET LOCAL ROLE decola_guard_owner;
GRANT CREATE ON SCHEMA decola_guard TO postgres;
CREATE TABLE decola_guard.run_scope (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
 run_id uuid NOT NULL UNIQUE,
 auth_h uuid NOT NULL UNIQUE,auth_e uuid NOT NULL UNIQUE,
 student_h uuid NOT NULL UNIQUE,student_e uuid NOT NULL UNIQUE,
 auth_not_before timestamptz NOT NULL,
 expires_at timestamptz NOT NULL,
 provisioned boolean NOT NULL DEFAULT false,
 CHECK(auth_h<>auth_e AND student_h<>student_e),
 CHECK(expires_at>auth_not_before AND expires_at<=auth_not_before+interval '10 minutes')
);
REVOKE ALL ON decola_guard.run_scope FROM PUBLIC,anon,authenticated,decola_homologacao,decola_probe_owner;
GRANT SELECT ON decola_guard.run_scope TO postgres;
GRANT INSERT(singleton,run_id,auth_h,auth_e,student_h,student_e,auth_not_before,expires_at) ON decola_guard.run_scope TO postgres;
RESET ROLE;
CREATE POLICY guard_account_read ON decola.accounts FOR SELECT TO decola_guard_owner
 USING(id IN (SELECT auth_h FROM decola_guard.run_scope UNION ALL SELECT auth_e FROM decola_guard.run_scope));
CREATE POLICY guard_account_insert ON decola.accounts FOR INSERT TO decola_guard_owner
 WITH CHECK(id IN (SELECT auth_h FROM decola_guard.run_scope UNION ALL SELECT auth_e FROM decola_guard.run_scope));
CREATE POLICY guard_student_read ON decola.students FOR SELECT TO decola_guard_owner
 USING(EXISTS(SELECT 1 FROM decola_guard.run_scope r WHERE (id=r.student_h AND account_id=r.auth_h) OR (id=r.student_e AND account_id=r.auth_e)));
CREATE POLICY guard_student_insert ON decola.students FOR INSERT TO decola_guard_owner
 WITH CHECK(EXISTS(SELECT 1 FROM decola_guard.run_scope r WHERE ((id=r.student_h AND account_id=r.auth_h) OR (id=r.student_e AND account_id=r.auth_e)) AND eligibility_key='2d:'||r.run_id::text||':'||account_id::text));
CREATE FUNCTION decola_guard.current_session() RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE v_uid uuid;v_sid uuid;
BEGIN
 v_uid:=auth.uid();v_sid:=(auth.jwt()->>'session_id')::uuid;
 IF v_uid IS NULL OR v_sid IS NULL THEN RETURN false;END IF;
 RETURN EXISTS(SELECT 1 FROM auth.sessions s WHERE s.id=v_sid AND s.user_id=v_uid AND (s.not_after IS NULL OR s.not_after>statement_timestamp()));
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION decola_guard.current_session() FROM PUBLIC,anon,authenticated,decola_homologacao;

-- Helpers booleanos privilegiados: propriedade postgres; nenhum retorno pessoal.
-- Nao sao uma conexao de teste RLS nem um login distribuido ao executor.
CREATE FUNCTION decola_guard.fixture_auth_valid(p_run uuid,p_user uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM decola_guard.run_scope r JOIN auth.users u ON u.id=p_user
 WHERE r.run_id=p_run AND p_user IN(r.auth_h,r.auth_e)
 AND lower(u.email)=CASE WHEN p_user=r.auth_h THEN 'horizonte+' ELSE 'estrela+' END||r.run_id::text||'@decola.example.invalid'
 AND u.raw_app_meta_data->>'persona'=CASE WHEN p_user=r.auth_h THEN 'horizonte' ELSE 'estrela' END
 AND u.raw_app_meta_data->>'decola_run_id'=r.run_id::text AND u.raw_app_meta_data->>'decola_stage'='2d_fixture'
 AND u.created_at>=r.auth_not_before AND u.created_at<r.expires_at
 AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp()));
$$;
REVOKE ALL ON FUNCTION decola_guard.current_session(),decola_guard.fixture_auth_valid(uuid,uuid) FROM PUBLIC,anon,authenticated,decola_homologacao;
GRANT EXECUTE ON FUNCTION decola_guard.fixture_auth_valid(uuid,uuid) TO decola_guard_owner;
SET LOCAL ROLE decola_guard_owner;
CREATE FUNCTION decola_guard.approved_scope(p_run uuid,p_h uuid,p_e uuid,p_sh uuid,p_se uuid,p_start timestamptz,p_end timestamptz) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM decola_guard.run_scope r WHERE r.run_id=p_run AND r.auth_h=p_h AND r.auth_e=p_e AND r.student_h=p_sh AND r.student_e=p_se
 AND r.auth_not_before=p_start AND r.expires_at=p_end AND NOT r.provisioned AND clock_timestamp()>=r.auth_not_before AND clock_timestamp()<r.expires_at);
$$;
CREATE FUNCTION decola_guard.active_session(p_run uuid,p_user uuid,p_session uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE old_sub text;old_claims text;old_claim text;answer boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM decola_guard.run_scope r WHERE r.run_id=p_run AND r.provisioned AND p_user IN(r.auth_h,r.auth_e) AND clock_timestamp()<r.expires_at)
 OR NOT decola_guard.fixture_auth_valid(p_run,p_user) THEN RETURN false;END IF;
 old_sub:=current_setting('request.jwt.claim.sub',true);old_claims:=current_setting('request.jwt.claims',true);old_claim:=current_setting('request.jwt.claim',true);
 BEGIN
  PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
  PERFORM set_config('request.jwt.claim','',true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',p_user,'session_id',p_session)::text,true);
  answer:=decola.active_account();
 EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);PERFORM set_config('request.jwt.claim',coalesce(old_claim,''),true);RAISE;
 END;
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);PERFORM set_config('request.jwt.claim',coalesce(old_claim,''),true);
 RETURN answer;
END $$;
CREATE FUNCTION decola_guard.inspect_pair(p_run uuid) RETURNS TABLE(account_id uuid,student_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT a.id,s.id FROM decola_guard.run_scope r JOIN decola.accounts a ON a.id IN(r.auth_h,r.auth_e)
 JOIN decola.students s ON s.account_id=a.id
 WHERE r.run_id=p_run AND r.provisioned AND
 ((a.id=r.auth_h AND s.id=r.student_h) OR (a.id=r.auth_e AND s.id=r.student_e))
 AND s.eligibility_key='2d:'||r.run_id::text||':'||a.id::text;
$$;
CREATE FUNCTION decola_guard.expected_student(p_run uuid,p_user uuid) RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN p_user=r.auth_h THEN r.student_h WHEN p_user=r.auth_e THEN r.student_e END
 FROM decola_guard.run_scope r WHERE r.run_id=p_run AND r.provisioned;
$$;
CREATE FUNCTION decola_guard.provision_pair(p_run uuid) RETURNS TABLE(account_id uuid,student_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r decola_guard.run_scope;
BEGIN
 SELECT * INTO r FROM decola_guard.run_scope WHERE run_id=p_run FOR UPDATE;
 IF NOT FOUND OR clock_timestamp()>=r.expires_at THEN RAISE EXCEPTION 'Scope unavailable' USING ERRCODE='42501';END IF;
 IF r.provisioned THEN RETURN QUERY SELECT * FROM decola_guard.inspect_pair(p_run);RETURN;END IF;
 IF NOT decola_guard.fixture_auth_valid(p_run,r.auth_h) OR NOT decola_guard.fixture_auth_valid(p_run,r.auth_e)
 OR EXISTS(SELECT 1 FROM decola.accounts a WHERE a.id IN(r.auth_h,r.auth_e))
 OR EXISTS(SELECT 1 FROM decola.students s WHERE s.id IN(r.student_h,r.student_e) OR s.account_id IN(r.auth_h,r.auth_e))
 THEN RAISE EXCEPTION 'Fixture mismatch or preexisting resource' USING ERRCODE='42501';END IF;
 INSERT INTO decola.accounts(id) VALUES(r.auth_h),(r.auth_e);
 INSERT INTO decola.students(id,account_id,eligibility_key) VALUES
 (r.student_h,r.auth_h,'2d:'||r.run_id::text||':'||r.auth_h::text),
 (r.student_e,r.auth_e,'2d:'||r.run_id::text||':'||r.auth_e::text);
 UPDATE decola_guard.run_scope SET provisioned=true WHERE run_id=p_run;
 RETURN QUERY SELECT * FROM decola_guard.inspect_pair(p_run);
END $$;
-- Revogar apenas funcoes do guard owner (nao precisa alterar ACL dos helpers postgres).
REVOKE ALL ON FUNCTION decola_guard.approved_scope(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz),decola_guard.active_session(uuid,uuid,uuid),decola_guard.inspect_pair(uuid),decola_guard.provision_pair(uuid),decola_guard.expected_student(uuid,uuid) FROM PUBLIC,anon,authenticated,decola_homologacao,decola_probe_owner;

GRANT EXECUTE ON FUNCTION decola_guard.active_session(uuid,uuid,uuid) TO decola_homologacao,decola_probe_owner;
GRANT EXECUTE ON FUNCTION decola_guard.expected_student(uuid,uuid) TO decola_probe_owner;
GRANT EXECUTE ON FUNCTION decola_guard.approved_scope(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz) TO decola_homologacao;
GRANT EXECUTE ON FUNCTION decola_guard.provision_pair(uuid),decola_guard.inspect_pair(uuid) TO decola_homologacao;
RESET ROLE;
-- Protege RLS e RPCs existentes via active_account; nao apenas o BFF.
CREATE OR REPLACE FUNCTION decola.active_account() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT decola_guard.current_session() AND EXISTS(SELECT 1 FROM decola.accounts a JOIN auth.users u ON u.id=a.id
 WHERE a.id=auth.uid() AND NOT a.disabled AND u.email_confirmed_at IS NOT NULL
 AND u.deleted_at IS NULL AND (u.banned_until IS NULL OR u.banned_until<=statement_timestamp()));
$$;
-- O dono atual de active_account precisa de USAGE/EXECUTE do helper.
GRANT USAGE ON SCHEMA decola_guard TO postgres;
GRANT EXECUTE ON FUNCTION decola_guard.current_session() TO postgres;
-- Criacao administrativa da sonda; transfere dono sem dar CREATE ao login.
CREATE FUNCTION decola_guard.student_action(p_run uuid,p_user uuid,p_session uuid,p_action text,p_student uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;v_student uuid;old_sub text;old_claims text;old_claim text;old_role text;
BEGIN
 IF NOT decola_guard.active_session(p_run,p_user,p_session) THEN RAISE EXCEPTION 'Session unavailable' USING ERRCODE='42501';END IF;
 IF p_action NOT IN('students','progress','canStudy','requestTrial','cancelTrial') OR p_action IS NULL THEN RAISE EXCEPTION 'Action unavailable' USING ERRCODE='42501';END IF;
 v_student:=decola_guard.expected_student(p_run,p_user);
 IF v_student IS NULL OR (p_action<>'students' AND p_student IS DISTINCT FROM v_student) THEN RAISE EXCEPTION 'Resource unavailable' USING ERRCODE='42501';END IF;
 old_sub:=current_setting('request.jwt.claim.sub',true);old_claims:=current_setting('request.jwt.claims',true);old_claim:=current_setting('request.jwt.claim',true);old_role:=current_setting('request.jwt.claim.role',true);
 BEGIN
  PERFORM set_config('request.jwt.claim.sub',p_user::text,true);
  PERFORM set_config('request.jwt.claim.role','authenticated',true);
  PERFORM set_config('request.jwt.claim','',true);
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',p_user,'role','authenticated','session_id',p_session)::text,true);
  CASE p_action
  WHEN 'students' THEN SELECT coalesce(jsonb_agg(jsonb_build_object('id',s.id)),'[]'::jsonb) INTO result FROM decola.students s WHERE s.id=v_student;
  WHEN 'progress' THEN SELECT coalesce(jsonb_agg(to_jsonb(p)),'[]'::jsonb) INTO result FROM (SELECT question_id,content_version,state,revision FROM decola.lesson_progress WHERE student_id=p_student) p;
  WHEN 'canStudy' THEN result:=jsonb_build_object('allowed',decola.can_study(p_student));
  WHEN 'requestTrial' THEN result:=decola.request_trial(p_student);
  WHEN 'cancelTrial' THEN PERFORM decola.cancel_trial(p_student);result:='{}'::jsonb;
  END CASE;
 EXCEPTION WHEN OTHERS THEN
  PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);PERFORM set_config('request.jwt.claim',coalesce(old_claim,''),true);PERFORM set_config('request.jwt.claim.role',coalesce(old_role,''),true);RAISE;
 END;
 PERFORM set_config('request.jwt.claim.sub',coalesce(old_sub,''),true);PERFORM set_config('request.jwt.claims',coalesce(old_claims,''),true);PERFORM set_config('request.jwt.claim',coalesce(old_claim,''),true);PERFORM set_config('request.jwt.claim.role',coalesce(old_role,''),true);
 RETURN result;
END $$;
SET LOCAL ROLE decola_guard_owner;
GRANT CREATE ON SCHEMA decola_guard TO decola_probe_owner;
RESET ROLE;
ALTER FUNCTION decola_guard.student_action(uuid,uuid,uuid,text,uuid) OWNER TO decola_probe_owner;
SET LOCAL ROLE decola_guard_owner;
REVOKE CREATE ON SCHEMA decola_guard FROM decola_probe_owner;
RESET ROLE;
REVOKE ALL ON FUNCTION decola_guard.student_action(uuid,uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION decola_guard.student_action(uuid,uuid,uuid,text,uuid) TO decola_homologacao;
SET LOCAL ROLE decola_guard_owner;
REVOKE CREATE ON SCHEMA decola_guard FROM postgres;
RESET ROLE;
-- O criador conserva ADMIN do ciclo de vida, mas sem heranca ou SET ativo.
GRANT decola_guard_owner,decola_probe_owner TO postgres WITH SET FALSE;
-- Nenhum GRANT de tabela ou membership ao login decola_homologacao.
COMMIT;
-- Manifesto permanece VAZIO. Aprovar separadamente INSERT de uma linha com
-- run/2 Auth IDs PREPLANEJADOS,2 student IDs,janela de 10min. Sem isso tudo nega.
