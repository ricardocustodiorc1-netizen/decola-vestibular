import {validatePgTls} from '../executor/postgres-security.mjs';
export const SCOPED_PERMISSION_QUERY=`SELECT current_user AS role,session_user AS login_role,
 EXISTS(SELECT 1 FROM pg_catalog.pg_roles r WHERE pg_has_role(session_user,r.oid,'MEMBER') AND
 (r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication OR r.rolname IN ('authenticated','service_role','postgres','decola_guard_owner','decola_probe_owner'))) AS forbidden_membership,
 EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('auth','decola','decola_guard') AND c.relkind='r' AND
 (has_any_column_privilege(current_user,c.oid,'SELECT') OR has_any_column_privilege(current_user,c.oid,'INSERT') OR has_any_column_privilege(current_user,c.oid,'UPDATE') OR has_table_privilege(current_user,c.oid,'DELETE') OR has_table_privilege(current_user,c.oid,'TRUNCATE'))) AS direct_table_access,
 EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname NOT LIKE 'pg_temp_%' AND has_schema_privilege(current_user,n.oid,'CREATE')) AS can_create,
 has_schema_privilege(current_user,'decola_guard','USAGE') AS guard_usage,
 EXISTS(SELECT 1 FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='decola_guard' AND p.oid::regprocedure::text NOT IN ('decola_guard.approved_scope(uuid,uuid,uuid,uuid,uuid,timestamp with time zone,timestamp with time zone)','decola_guard.provision_pair(uuid)','decola_guard.inspect_pair(uuid)','decola_guard.active_session(uuid,uuid,uuid)','decola_guard.student_action(uuid,uuid,uuid,text,uuid)') AND has_function_privilege(current_user,p.oid,'EXECUTE')) AS extra_execute,
 has_function_privilege(current_user,'decola_guard.approved_scope(uuid,uuid,uuid,uuid,uuid,timestamptz,timestamptz)','EXECUTE') AND
 has_function_privilege(current_user,'decola_guard.provision_pair(uuid)','EXECUTE') AND
 has_function_privilege(current_user,'decola_guard.inspect_pair(uuid)','EXECUTE') AND
 has_function_privilege(current_user,'decola_guard.active_session(uuid,uuid,uuid)','EXECUTE') AND
 has_function_privilege(current_user,'decola_guard.student_action(uuid,uuid,uuid,text,uuid)','EXECUTE') AS functions_present`;
export async function validateScopedPg(client,config){
 try{const tls=validatePgTls(client,config),{rows}=await client.query({text:SCOPED_PERMISSION_QUERY,query_timeout:5000}),r=rows[0];
  if(rows.length!==1||r.role!=='decola_homologacao'||r.login_role!==r.role||r.forbidden_membership!==false||r.direct_table_access!==false||r.can_create!==false||r.extra_execute!==false||r.guard_usage!==true||r.functions_present!==true)throw Error();
  return {...tls,scope:'private-function-only',roleVerified:true};
 }catch{try{client.release?.(true);}catch{}throw Error('SCOPED_PG_PREFLIGHT_FAILED');}
}
