// Request preparation only. No fetch, transport, environment lookup or API key.
import { timingSafeEqual } from 'node:crypto';
export const ASAAS_SANDBOX='https://api-sandbox.asaas.com/v3';
export function prepareSandboxCheckout({expressChoice,policyVersion,intentId,customerId,callbackOrigin,serverDate}){
 if(expressChoice!==true||policyVersion!=='commercial-v1')throw Error('Explicit choice required');
 if(typeof intentId!=='string'||typeof customerId!=='string'||!/^[A-Za-z0-9_-]{1,100}$/.test(intentId)||!/^cus_[A-Za-z0-9_]{1,100}$/.test(customerId))throw Error('Server references required');
 const origin=new URL(callbackOrigin);
 if(origin.origin!==callbackOrigin||origin.protocol!=='https:'||!origin.hostname.endsWith('.invalid'))throw Error('Only disconnected callback placeholders allowed');
 if(!(serverDate instanceof Date)||!Number.isFinite(serverDate.getTime()))throw Error('Server date required');
 return {
  environment:'sandbox',sent:false,method:'POST',url:ASAAS_SANDBOX+'/checkouts',
  body:{billingTypes:['CREDIT_CARD'],chargeTypes:['RECURRENT'],minutesToExpire:60,externalReference:intentId,customer:customerId,
   items:[{name:'Decola Vestibular mensal',description:'Adesão expressa após teste gratuito sem cartão',quantity:1,value:39.90}],
   subscription:{cycle:'MONTHLY',nextDueDate:serverDate.toISOString().slice(0,10)},
   callback:{successUrl:callbackOrigin+'/assinatura/retorno',cancelUrl:callbackOrigin+'/assinatura/cancelado',expiredUrl:callbackOrigin+'/assinatura/expirado'}}
 };
}
export function verifySandboxWebhookToken(provided,expected){
 if(typeof provided!=='string'||typeof expected!=='string'||expected.length<32||expected.length>256||Buffer.byteLength(provided)!==Buffer.byteLength(expected))return false;
 return timingSafeEqual(Buffer.from(provided),Buffer.from(expected));
}
// Provider adapter must still persist/deduplicate inbox, reconcile canonical payment,
// verify sandbox/account/amount/currency/customer and THEN grant a paid period.
// Checkout return URLs and this helper never grant access.
