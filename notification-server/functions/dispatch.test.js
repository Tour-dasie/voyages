const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {dueReminders,notificationPayload,allowedEndpoint,timezoneFor}=require('./planner');
function setup({checked=false,expired=false,enabled=true}={}){
 const content={STAGES:[],REMINDERS:[{id:'task',date:'2026-10-10',t:'Tâche',s:'Détail'}]};
 const values={'voyages/asie/notificationSettings':{enabled},'voyages/asie/content':JSON.stringify(content),'voyages/asie/data/blob':JSON.stringify({reminders:{task:checked}}),'push':{device:{endpoint:'https://web.push.apple.com/test',keys:{auth:'test',p256dh:'test'}}}};
 const value=p=>{if(p in values)return values[p];const found={};for(const [path,val]of Object.entries(values))if(path.startsWith(p+'/')){const suffix=path.slice(p.length+1);if(!suffix.includes('/'))found[suffix]=val;}return Object.keys(found).length?found:null;};
 const db={ref(p){return {child(s){return db.ref(p+'/'+s)},async once(){return {val:()=>value(p)}},async set(v){values[p]=v},async update(v){values[p]={...value(p),...v}},async transaction(fn){const next=fn(value(p));if(next===undefined)return {committed:false};values[p]=next;return {committed:true}}}}};
 let sent=0;
 const exports={},context={exports,module:{exports},require(name){if(name.includes('scheduler'))return {onSchedule:(_o,fn)=>fn};if(name.includes('params'))return {defineSecret:()=>({value:()=>''})};if(name==='firebase-admin/app')return {initializeApp(){}};if(name==='firebase-admin/database')return {getDatabase:()=>db};if(name==='web-push')return {setVapidDetails(){},async sendNotification(){if(expired)throw {statusCode:410};sent++;}};if(name==='./planner')return {dueReminders,notificationPayload,allowedEndpoint,timezoneFor};throw Error(name);},Date,JSON,Number,Object,Array,Set};
 vm.runInNewContext(fs.readFileSync(__dirname+'/index.js','utf8')+'\nmodule.exports.testDispatch=dispatch;',context);
 return {run:()=>exports.testDispatch(db,new Date('2026-10-10T10:00:00Z')),sent:()=>sent,values};
}
test('Each device/task accepted only once across repeated scheduler runs',async()=>{const s=setup();await s.run();await s.run();assert.equal(s.sent(),1);assert(s.values['notificationDelivery/asie/device/task'].sentAt);assert.equal(s.values['voyages/asie/notificationService'].status,'active');});
test('Checked task does not send',async()=>{const s=setup({checked:true});await s.run();assert.equal(s.sent(),0);});
test('Expired subscription disabled and not marked sent',async()=>{const s=setup({expired:true});await s.run();assert.equal(s.sent(),0);assert.equal(s.values['push/device'].disabled,true);assert(!s.values['notificationDelivery/asie/device/task'].sentAt);});
test('Disabled settings do not send or claim active service',async()=>{const s=setup({enabled:false});await s.run();assert.equal(s.sent(),0);assert(!s.values['voyages/asie/notificationService']);});
