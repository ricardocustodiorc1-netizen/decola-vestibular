-- PROPOSTA NAO EXECUTADA. Aprovacao especifica futura; nao remove dados/sessoes.
-- Fase A: contenção reversivel. Parar executor e obter quietude antes de aplicar.
BEGIN;
ALTER ROLE decola_homologacao NOLOGIN;
GRANT decola_guard_owner,decola_probe_owner TO postgres WITH SET TRUE;
SET LOCAL ROLE decola_guard_owner;
REVOKE ALL ON FUNCTION decola_guard.approved_scope(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz),decola_guard.provision_pair(uuid),decola_guard.inspect_pair(uuid),decola_guard.active_session(uuid,uuid,uuid) FROM decola_homologacao;
REVOKE USAGE ON SCHEMA decola_guard FROM decola_homologacao;
RESET ROLE;
SET LOCAL ROLE decola_probe_owner;
REVOKE ALL ON FUNCTION decola_guard.student_action(uuid,uuid,uuid,text,uuid) FROM decola_homologacao;
RESET ROLE;
GRANT decola_guard_owner,decola_probe_owner TO postgres WITH SET FALSE;
COMMIT;
-- Preserva manifesto, contas, progresso, RLS e a protecao de sessao.
-- Restauracao estrutural completa NAO e implicita nesta contenção:
-- exige inventario/retencao resolvidos, Data API decola nao exposta e aprovacao
-- para reverter active_account ao corpo anterior e remover objetos/policies.
-- Abaixo somente em instalacao ainda vazia, por instalador com ownership adequado.
-- Executar em arquivo separado apos aprovacao; nao e limpeza de fixtures.
