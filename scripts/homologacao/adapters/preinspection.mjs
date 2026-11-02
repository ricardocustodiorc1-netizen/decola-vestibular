import {PROJECT,ORGANIZATION} from '../controls/ledger.mjs';
export function preinspectionPlan(){return Object.freeze({projectId:PROJECT,organizationId:ORGANIZATION,execution:'blocked',writes:false,keys:false,personalData:false,
 managementFields:['project.id','project.organization_id','project.name','project.region','project.status','organization.plan'],
 authSettingsPending:['email confirmation','redirect allowlist','SMTP/limits','session settings'],
 queries:[
  "SELECT table_schema,table_name,column_name,data_type FROM information_schema.columns WHERE (table_schema='auth' AND table_name IN ('users','sessions')) OR table_schema='decola'",
  "SELECT n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='decola'",
  "SELECT nspname,nspacl FROM pg_catalog.pg_namespace WHERE nspname IN ('public','decola','auth') ORDER BY nspname",
  "SELECT n.nspname,c.relname,c.relrowsecurity,c.relforcerowsecurity FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','decola') AND c.relkind IN ('r','p')",
  "SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_catalog.pg_policies WHERE schemaname='decola'",
  "SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.table_privileges WHERE table_schema='decola' AND grantee IN ('anon','authenticated','PUBLIC')"
 ]});}
export function executePreinspection(){throw Error('PREINSPECTION_NOT_AUTHORIZED');}
