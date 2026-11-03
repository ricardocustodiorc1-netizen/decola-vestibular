-- PROPOSTA NAO EXECUTADA. Autorizacao separada; apenas se criado nesta etapa,
-- sem objetos/dependencias novos, conexoes quiescentes e inventario conferido.
-- Nao derrubar sessoes automaticamente. Nao usar DROP OWNED/CASCADE.
BEGIN;
ALTER ROLE decola_homologacao NOLOGIN;
REVOKE authenticated FROM decola_homologacao;
REVOKE CONNECT ON DATABASE postgres FROM decola_homologacao;
REVOKE USAGE ON SCHEMA decola, auth FROM decola_homologacao;
REVOKE SELECT(id,disabled) ON decola.accounts FROM decola_homologacao;
REVOKE SELECT(id,account_id,eligibility_key) ON decola.students FROM decola_homologacao;
REVOKE SELECT(student_id,question_id,content_version,state,revision)
 ON decola.lesson_progress FROM decola_homologacao;
REVOKE SELECT(id,email,raw_app_meta_data,email_confirmed_at,deleted_at,banned_until)
 ON auth.users FROM decola_homologacao;
REVOKE SELECT(id,user_id,not_after) ON auth.sessions FROM decola_homologacao;
DROP ROLE decola_homologacao;
COMMIT;
-- Se houver dependencia, falha e reverte a transacao. Inspecionar, nao usar CASCADE.
