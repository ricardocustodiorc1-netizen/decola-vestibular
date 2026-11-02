import {checkPermit,id,scope} from './boundary.mjs';
export class PreparedHttpAdapter{
 constructor({request,permit,origin}){
  const url=new URL(origin);if(url.origin!==origin||url.protocol!=='https:'||url.username||url.password)throw Error('INVALID_HTTP_ORIGIN');
  this.request=request;this.permit=permit;this.origin=origin;
 }
 async probe({path,token,expectedStatuses,expectedUserId,signal}){
  checkPermit(this.permit);
  if(typeof token!=='string'||!token||token.length>16384||/[\r\n]/.test(token)||!['/api/me'].includes(path)&&!/^\/api\/students\/[a-f0-9-]{36}\/progress$/.test(path))throw Error('INVALID_HTTP_PROBE');
  if(expectedUserId)id(expectedUserId);
  let response;
  try{response=await this.request(this.origin+path,{method:'GET',headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},redirect:'error',signal:signal?AbortSignal.any([signal,AbortSignal.timeout(5000)]):AbortSignal.timeout(5000)});}catch{throw Error('HTTP_PROBE_FAILED');}
  if(response.redirected||response.status>=300&&response.status<400||!expectedStatuses.includes(response.status))throw Error('HTTP_STATUS_UNEXPECTED');
  if(expectedUserId){let body;try{body=await response.json();}catch{throw Error('HTTP_BODY_INVALID');}if(body.accountId!==expectedUserId)throw Error('HTTP_IDENTITY_MISMATCH');}
  return {status:response.status,scope};
 }
 ownIdentity(token,userId,signal){return this.probe({path:'/api/me',token,expectedStatuses:[200],expectedUserId:userId,signal});}
 foreignProgress(token,foreignStudentId,signal){id(foreignStudentId);return this.probe({path:`/api/students/${foreignStudentId}/progress`,token,expectedStatuses:[403,404],signal});}
 async accessDenied(token,signal){await this.probe({path:'/api/me',token,expectedStatuses:[401,403],signal});return true;}
}
