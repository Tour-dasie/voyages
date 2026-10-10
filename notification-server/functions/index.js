'use strict';
const {onSchedule}=require('firebase-functions/v2/scheduler');
const {defineSecret}=require('firebase-functions/params');
const {initializeApp}=require('firebase-admin/app');
const {getDatabase}=require('firebase-admin/database');
const webpush=require('web-push');
const {dueReminders,notificationPayload,allowedEndpoint,timezoneFor}=require('./planner');
const privateKey=defineSecret('WEB_PUSH_VAPID_PRIVATE');
const publicKey='BP_AP4FOamPTOp16r_xJ9B-BTE7JzAlRQdm3YyjdXmGidbZVC7wapqCyYOXqzgVOlP1Xlo356c-RHy7BLpqT5Ec';
initializeApp({databaseURL:'https://tour-dasie-default-rtdb.europe-west1.firebasedatabase.app'});
async function dispatch(db,now=new Date()){
 const trip='asie',base=db.ref(`voyages/${trip}`),config=(await base.child('notificationSettings').once('value')).val()||{};
 if(!config.enabled)return {enabled:false,accepted:0};
 const [contentSnap,stateSnap,devicesSnap]=await Promise.all([base.child('content').once('value'),base.child('data/blob').once('value'),db.ref('push').once('value')]);
 const content=JSON.parse(contentSnap.val()||'{}'),state=JSON.parse(stateSnap.val()||'{}'),devices=devicesSnap.val()||{};
 let accepted=0,failed=0;
 for(const [key,device]of Object.entries(devices)){
  if(!allowedEndpoint(device.endpoint)||!device.keys||device.disabled||(Array.isArray(device.trips)&&!device.trips.includes(trip)))continue;
  const due=dueReminders(content,state,device,now),logs=(await db.ref(`notificationDelivery/${trip}/${key}`).once('value')).val()||{};
  // Cap per run; remaining individual tasks are picked up on the next run.
  const unsent=due.filter(r=>!logs[r.id]?.sentAt).slice(0,20);
  for(const r of unsent){
   const log=db.ref(`notificationDelivery/${trip}/${key}/${r.id}`),lease=now.getTime();
   const claim=await log.transaction(v=>{if(v?.sentAt||(v?.leaseAt&&lease-v.leaseAt<120000))return;return {...v,leaseAt:lease};});
   if(!claim.committed)continue;
   try{
    const latest=JSON.parse((await base.child('data/blob').once('value')).val()||'{}');
    if(latest.reminders?.[r.id]){await log.update({leaseAt:0,cancelledAt:Date.now()});continue;}
    await webpush.sendNotification({endpoint:device.endpoint,keys:device.keys},JSON.stringify(notificationPayload(r,trip)),{TTL:21600,urgency:'normal',timeout:15000});
    await log.update({sentAt:Date.now(),leaseAt:0});accepted++;
   }catch(err){
    await log.update({leaseAt:0,lastAttemptAt:Date.now(),lastStatus:Number(err.statusCode)||0});failed++;
    if(err.statusCode===404||err.statusCode===410){await db.ref(`push/${key}`).update({disabled:true,disabledAt:Date.now()});break;}
   }
  }
  if(device.testRequestedAt&&device.testRequestedAt>(device.testSentAt||0)&&now.getTime()-device.testRequestedAt<3600000){
   try{await webpush.sendNotification({endpoint:device.endpoint,keys:device.keys},JSON.stringify({title:'✅ Test serveur — Tour d’Asie',body:'Ce message a été envoyé par le service de notifications. Il peut arriver même lorsque le carnet est fermé.',tag:`server-test-${device.testRequestedAt}`,url:'https://tour-dasie.github.io/voyages/?notifications=test'}),{TTL:3600,timeout:15000});await db.ref(`push/${key}`).update({testSentAt:Date.now()});accepted++;}catch{failed++;}
  }
 }
 await base.child('notificationService').set({status:'active',lastRunAt:Date.now(),accepted,failed,mode:'individual',cadenceMinutes:15});
 return {enabled:true,accepted,failed};
}
exports.sendTripReminders=onSchedule({schedule:'every 15 minutes',timeZone:'UTC',region:'europe-west1',secrets:[privateKey],timeoutSeconds:300,maxInstances:1,retryCount:0},async()=>{
 webpush.setVapidDetails('https://tour-dasie.github.io/voyages/',publicKey,privateKey.value());
 return dispatch(getDatabase());
});
