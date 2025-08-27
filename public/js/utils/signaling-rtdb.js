function initFirebase(){
  if(typeof firebase==='undefined') throw new Error('Firebase SDK não encontrada');
  if(!window.FIREBASE_CONFIG||!window.FIREBASE_CONFIG.apiKey) throw new Error('FIREBASE_CONFIG ausente.');
  try{ if(!firebase.apps||firebase.apps.length===0){ firebase.initializeApp(window.FIREBASE_CONFIG); } }catch(e){}
  return firebase.database();
}
export async function createSession(code, pc){
  const db=initFirebase(); const sess=db.ref('sessions').child(code);
  try{ await sess.remove(); }catch(e){}
  const offer=await pc.createOffer(); await pc.setLocalDescription(offer);
  await sess.child('offer').set(offer.toJSON());
  pc.addEventListener('icecandidate',ev=>{ if(ev.candidate){ sess.child('callerCandidates').push(ev.candidate.toJSON()); } });
  sess.child('answer').on('value',async snap=>{ const ans=snap.val(); if(ans && !pc.currentRemoteDescription){ try{ await pc.setRemoteDescription(new RTCSessionDescription(ans)); }catch(e){} } });
  sess.child('calleeCandidates').on('child_added',async snap=>{ const c=snap.val(); if(c){ try{ await pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} } });
  return async()=>{ try{sess.off();}catch{} try{await sess.remove();}catch{} };
}
export async function joinSession(code, pc){
  const db=initFirebase(); const sess=db.ref('sessions').child(code);
  const offer=(await sess.child('offer').get()).val(); if(!offer) throw new Error('Sessão inexistente.');
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer=await pc.createAnswer(); await pc.setLocalDescription(answer);
  await sess.child('answer').set(answer.toJSON());
  pc.addEventListener('icecandidate',ev=>{ if(ev.candidate){ sess.child('calleeCandidates').push(ev.candidate.toJSON()); } });
  sess.child('callerCandidates').on('child_added',async snap=>{ const c=snap.val(); if(c){ try{ await pc.addIceCandidate(new RTCIceCandidate(c)); }catch(e){} } });
  return async()=>{ try{sess.off();}catch{} };
}