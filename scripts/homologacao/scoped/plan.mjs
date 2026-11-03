import {target,id} from '../adapters/boundary.mjs';
export function validateScope(p){
 target(p);const ids=[p.authH,p.authE,p.studentH,p.studentE];ids.forEach(id);
 if(new Set(ids).size!==4||!Number.isSafeInteger(p.startsAt)||!Number.isSafeInteger(p.expiresAt)||p.expiresAt<=p.startsAt||p.expiresAt-p.startsAt>600000)throw Error('INVALID_SCOPE');
 return Object.freeze({...p});
}
export function approvalSql(input){
 const p=validateScope(input),date=n=>new Date(n).toISOString();
 return `-- REVIEW ONLY; separate authorization required. One singleton run; no overwrite.\nINSERT INTO decola_guard.run_scope(run_id,auth_h,auth_e,student_h,student_e,auth_not_before,expires_at) VALUES ('${p.runId}','${p.authH}','${p.authE}','${p.studentH}','${p.studentE}','${date(p.startsAt)}','${date(p.expiresAt)}');\n`;
}
export function expectedResources(p){return [{kind:'account',id:p.authH},{kind:'student',id:p.studentH},{kind:'account',id:p.authE},{kind:'student',id:p.studentE}].map(r=>({...r,runId:p.runId,projectId:p.projectId}));}
