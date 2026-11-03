-- PROPOSTA PARA REVISAO. NAO EXECUTADA. PostgreSQL 17.
-- Leitura DIRETA: SET ROLE authenticated tambem permite RPCs existentes que escrevem.
-- Nao e um papel globalmente read-only nem limitado a duas identidades pelo banco.
-- Apenas o alvo yxxrfhobhonigwczzpim, apos autorizacao especifica.
-- O papel deve NAO existir; colisao aborta. Sem senha no SQL/commits.
-- Nao resolve RLS de provisionamento ou o join servidor de activeSession.
BEGIN;
CREATE ROLE decola_homologacao LOGIN NOINHERIT NOSUPERUSER NOCREATEDB
 NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2 PASSWORD NULL;
GRANT CONNECT ON DATABASE postgres TO decola_homologacao;
GRANT USAGE ON SCHEMA decola, auth TO decola_homologacao;
GRANT SELECT(id,disabled) ON decola.accounts TO decola_homologacao;
GRANT SELECT(id,account_id,eligibility_key) ON decola.students TO decola_homologacao;
GRANT SELECT(student_id,question_id,content_version,state,revision)
 ON decola.lesson_progress TO decola_homologacao;
GRANT SELECT(id,email,raw_app_meta_data,email_confirmed_at,deleted_at,banned_until)
 ON auth.users TO decola_homologacao;
GRANT SELECT(id,user_id,not_after) ON auth.sessions TO decola_homologacao;
-- SET ROLE explicito para sondas RLS; sem heranca automatica ou ADMIN OPTION.
GRANT authenticated TO decola_homologacao WITH INHERIT FALSE;
GRANT authenticated TO decola_homologacao WITH SET TRUE;
GRANT authenticated TO decola_homologacao WITH ADMIN FALSE;
ALTER ROLE decola_homologacao SET statement_timeout='5s';
ALTER ROLE decola_homologacao SET lock_timeout='2s';
ALTER ROLE decola_homologacao SET idle_in_transaction_session_timeout='10s';
COMMIT;
-- A senha permanece NULL (login por senha inviavel) ate provisionamento seguro
-- separado pelo titular. Nao executar ALTER USER ... PASSWORD com segredo em SQL.
-- Nao conceder INSERT: sem politica de INSERT esse GRANT nao libera RLS.
