import tls from 'node:tls';
import net from 'node:net';
import {PROJECT} from '../controls/ledger.mjs';
export function restrictedPgConfig({host,port=5432,user,database='postgres',password,ca}){
 if(host!==`db.${PROJECT}.supabase.co`||net.isIP(host)||port!==5432||user!=='decola_homologacao'||database!=='postgres'||typeof password!=='string'||!password||typeof ca!=='string'||!ca.includes('BEGIN CERTIFICATE'))throw Error('PG_CONFIG_REJECTED');
 return {host,port,user,database,password,max:1,connectionTimeoutMillis:5000,query_timeout:5000,statement_timeout:5000,ssl:{ca,minVersion:'TLSv1.2',rejectUnauthorized:true,servername:host,checkServerIdentity:tls.checkServerIdentity}};
}
export function validatePgTls(client,config,{now=Date.now()}={}){
 const socket=client?.connection?.stream,ssl=config?.ssl;
 if(config.host!==`db.${PROJECT}.supabase.co`||ssl?.rejectUnauthorized!==true||ssl.servername!==config.host||ssl.checkServerIdentity!==tls.checkServerIdentity||!ssl.ca||socket?.encrypted!==true||socket.authorized!==true||(socket.servername&&socket.servername!==config.host))throw Error('PG_TLS_REJECTED');
 if(!['TLSv1.2','TLSv1.3'].includes(socket.getProtocol?.()))throw Error('PG_TLS_REJECTED');
 const cert=socket.getPeerCertificate();
 if(tls.checkServerIdentity(config.host,cert)||!Number.isFinite(Date.parse(cert.valid_from))||!Number.isFinite(Date.parse(cert.valid_to))||now<Date.parse(cert.valid_from)||now>=Date.parse(cert.valid_to))throw Error('PG_CERTIFICATE_REJECTED');
 return {tlsVerified:true,hostnameVerified:true};
}
export const PERMISSION_QUERY=`SELECT current_user AS role, session_user AS login_role,
 r.rolinherit AS inherits,
 pg_catalog.pg_has_role(current_user,'authenticated','SET WITH ADMIN OPTION') AS admin_option,
 r.rolsuper OR r.rolbypassrls OR r.rolcreaterole OR r.rolcreatedb OR r.rolreplication AS elevated,
 EXISTS(SELECT 1 FROM pg_catalog.pg_roles x WHERE (x.rolsuper OR x.rolbypassrls OR x.rolname IN ('postgres','service_role','supabase_admin')) AND pg_catalog.pg_has_role(session_user,x.oid,'MEMBER')) AS elevated_membership,
 pg_catalog.pg_has_role(current_user,'authenticated','SET') AS can_set_authenticated,
 has_schema_privilege(current_user,'decola','USAGE') AND has_schema_privilege(current_user,'auth','USAGE') AS schema_usage,
 NOT EXISTS(SELECT 1 FROM (VALUES ('decola.accounts','id'),('decola.accounts','disabled'),('decola.students','id'),('decola.students','account_id'),('decola.students','eligibility_key'),('decola.lesson_progress','student_id'),('decola.lesson_progress','question_id'),('decola.lesson_progress','content_version'),('decola.lesson_progress','state'),('decola.lesson_progress','revision'),('auth.users','id'),('auth.users','email'),('auth.users','raw_app_meta_data'),('auth.users','email_confirmed_at'),('auth.users','deleted_at'),('auth.users','banned_until'),('auth.sessions','id'),('auth.sessions','user_id'),('auth.sessions','not_after')) AS needed(tbl,col) WHERE NOT has_column_privilege(current_user,needed.tbl,needed.col,'SELECT')) AS read_columns,
 EXISTS(SELECT 1 FROM pg_catalog.pg_namespace n WHERE n.nspname NOT LIKE 'pg_temp_%' AND has_schema_privilege(current_user,n.oid,'CREATE')) AS can_create,
 EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('decola','auth') AND c.relkind='r' AND (has_table_privilege(current_user,c.oid,'INSERT') OR has_table_privilege(current_user,c.oid,'UPDATE') OR has_table_privilege(current_user,c.oid,'DELETE') OR has_table_privilege(current_user,c.oid,'TRUNCATE') OR has_any_column_privilege(current_user,c.oid,'INSERT') OR has_any_column_privilege(current_user,c.oid,'UPDATE'))) AS table_writes
 FROM pg_catalog.pg_roles r WHERE r.rolname=current_user`;
export async function validateRestrictedPg(client,config){
 try{
  const tlsProof=validatePgTls(client,config);
  const {rows}=await client.query({text:PERMISSION_QUERY,query_timeout:5000}),r=rows[0];
  if(rows.length!==1||r.role!=='decola_homologacao'||r.login_role!==r.role||r.inherits!==false||r.admin_option!==false||r.elevated!==false||r.elevated_membership!==false||r.can_set_authenticated!==true||r.schema_usage!==true||r.read_columns!==true||r.can_create!==false||r.table_writes!==false)throw Error();
  return {...tlsProof,roleVerified:true,scope:'restricted-role-metadata-preflight',applicationRpcMayWrite:true,provisioningAuthorized:false,sessionJoinAuthorized:false};
 }catch{try{client.release?.(true);}catch{}throw Error('RESTRICTED_PG_PREFLIGHT_FAILED');}
}
