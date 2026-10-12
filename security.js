/* Defensive formatting shared by the page and service worker. No credentials. */
(function(root){
  'use strict';
  const htmlText=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inlineString=value=>htmlText(String(value??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029'));
  function imageURL(value){
    if(typeof value!=='string'||!value)return '';
    if(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value))return value;
    try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}
  }
  function notificationURL(value,base){
    const fallback=new URL('./',base).href;
    try{const u=new URL(value||'./',base),b=new URL(base);return u.origin===b.origin&&u.pathname.startsWith('/voyages/')?u.href:fallback;}catch{return fallback;}
  }
  const numericId=value=>Number.isSafeInteger(value)&&value>=0?String(value):'null';
  const validKey=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,160}$/.test(value)&&!['__proto__','constructor','prototype'].includes(value);
  function linkURL(value){try{const u=new URL(String(value));return ['https:','mailto:','tel:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'#';}catch{return '#';}}
  function richHTML(value){
    if(!root.DOMPurify)return htmlText(value);
    const fragment=root.DOMPurify.sanitize(String(value??''),{ALLOWED_TAGS:['b','strong','em','i','u','br','p','ul','ol','li','a','span','small'],ALLOWED_ATTR:['href','title'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false,RETURN_DOM_FRAGMENT:true});
    for(const a of fragment.querySelectorAll('a')){a.setAttribute('href',linkURL(a.getAttribute('href')));a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');}
    const holder=root.document.createElement('div');holder.appendChild(fragment);return holder.innerHTML;
  }
  function validateContent(content){
    function visit(value,key=''){
      if(Array.isArray(value)){if(key==='co'&&(value.length!==2||!value.every(Number.isFinite)||Math.abs(value[0])>90||Math.abs(value[1])>180))throw Error('Invalid coordinates');for(const item of value)visit(item);return;}
      if(value&&typeof value==='object'){for(const [k,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(k))throw Error('Invalid property');if(['id','stage','person','audience'].includes(k)&&v!==null&&!validKey(v))throw Error('Invalid identifier');if(k==='col'&&!/^#[0-9a-f]{6}$/i.test(v))throw Error('Invalid color');visit(v,k);}return;}
    }
    visit(content);
    for(const st of content.STAGES||[])for(const b of st.blocks||[])for(const d of b.days||[])if(!Number.isSafeInteger(d.n)||d.n<0)throw Error('Invalid day');
    for(const color of Object.values(content.CFLAG||{}))if(!/^#[0-9a-f]{6}$/i.test(color))throw Error('Invalid color');
    for(const coordinates of [...Object.values(content.SPOT_CO||{}),...Object.values(content.RESTO_CO||{})])visit(coordinates,'co');
    return content;
  }
  function validateState(value){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid backup');
    function visit(v){if(v&&typeof v==='object')for(const [key,item]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(key))throw Error('Invalid property');visit(item);}}
    visit(value);
    for(const key of ['expenses','flights','settlements'])if(value[key]!==undefined&&(!Array.isArray(value[key])||value[key].some(x=>!x||numericId(x.id)==='null')))throw Error('Invalid records');
    for(const key of ['days','blocks','check','reminders','photos','rates','wishlist','dayOrders'])if(value[key]!==undefined&&(!value[key]||typeof value[key]!=='object'||Array.isArray(value[key])))throw Error('Invalid state');
    return value;
  }
  const api={htmlText,inlineString,imageURL,notificationURL,numericId,validKey,linkURL,richHTML,validateContent,validateState};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.TravelSecurity=api;
})(typeof globalThis!=='undefined'?globalThis:this);
