-- PREPARED ONLY: do not execute before approval. Catalog metadata, no student records.
BEGIN TRANSACTION READ ONLY;
SELECT n.nspname AS schema_name,c.relname AS table_name,c.relrowsecurity AS rls
FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='decola' AND c.relkind IN ('r','p') ORDER BY c.relname;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_catalog.pg_policies WHERE schemaname='decola' ORDER BY tablename,policyname;
SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.table_privileges
WHERE table_schema='decola' AND grantee IN ('anon','authenticated','PUBLIC')
ORDER BY table_name,grantee,privilege_type;
SELECT n.nspname,p.proname,p.prosecdef,has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='decola' ORDER BY p.proname;
ROLLBACK;
