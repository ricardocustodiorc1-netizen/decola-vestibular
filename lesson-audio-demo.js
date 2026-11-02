import {lessonAudioCatalog,elvisExplanation} from './lesson-audio-catalog.js';
import {mountLessonAudio} from './lesson-audio.js';

document.getElementById('explanation').textContent=elvisExplanation;
const context={lessonId:'leo34.porcentagem',phase:'lesson',text:elvisExplanation};
mountLessonAudio({host:document.getElementById('ready-audio'),catalog:lessonAudioCatalog,id:'leo34.porcentagem.explicacao',getContext:()=>context});
mountLessonAudio({host:document.getElementById('missing-story'),catalog:lessonAudioCatalog,id:'leo34.porcentagem.historia',getContext:()=>({...context,text:'História'})});
mountLessonAudio({host:document.getElementById('different-text'),catalog:lessonAudioCatalog,id:'leo34.porcentagem.explicacao',getContext:()=>({...context,text:'20 ÷ 100 = 0,20; 150 × 0,20 = 30.'})});
const lesson=document.getElementById('lesson'),closed=document.getElementById('closed');
document.getElementById('close').addEventListener('click',()=>{lesson.hidden=true;closed.hidden=false;document.getElementById('reopen').focus();});
document.getElementById('reopen').addEventListener('click',()=>{closed.hidden=true;lesson.hidden=false;document.getElementById('close').focus();});
