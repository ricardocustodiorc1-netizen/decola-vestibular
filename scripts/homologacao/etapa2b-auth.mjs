// Offline target validation ONLY. Real account creation is disabled, including with gates set.
import { pathToFileURL } from 'node:url';
export function checkAuthTarget({projectId,url}={}){
 if(projectId!=='yxxrfhobhonigwczzpim'||(url&&url!=='https://yxxrfhobhonigwczzpim.supabase.co'))throw Error('Invalid target');
 return {mode:'check',network:false,usersCreated:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if((process.argv[2]??'check')!=='check'){console.error('BLOCKED: account creation is disabled');process.exitCode=2;}
 else try{checkAuthTarget({projectId:process.env.DECOLA_TEST_PROJECT_ID,url:process.env.SUPABASE_URL});console.log('PASS: target verified; no network or users created');}catch{console.error('BLOCKED: invalid target');process.exitCode=2;}
}
