// Assessment only. No installation, host inspection, provisioning or durability claim.
export function assessExecutorPlatform({platform,release='',root,filesystemType}){
 const reasons=[];if(platform!=='linux')reasons.push('LINUX_OR_WSL2_REQUIRED');
 if(typeof root!=='string'||!root.startsWith('/')||/^\/mnt\/[a-z](\/|$)/i.test(root)||['/tmp','/var/tmp','/workspace/scratch'].some(p=>root===p||root.startsWith(p+'/')))reasons.push('PRIVATE_LINUX_DISK_REQUIRED');
 if(![0xef53,0x58465342,0x9123683e].includes(filesystemType))reasons.push('FILESYSTEM_REQUIRES_REVIEW');
 return {candidate:reasons.length===0,wsl:/microsoft/i.test(release),reasons,durabilityVerified:false,installed:false};
}
