const {test}=require('node:test');
const assert=require('node:assert/strict');
const {htmlText,inlineString,imageURL,notificationURL,numericId}=require('./security.js');
test('labels and attributes retain punctuation as text',()=>{
  assert.equal(htmlText('Marie & Baptiste <voyage> "photo"'), 'Marie &amp; Baptiste &lt;voyage&gt; &quot;photo&quot;');
  assert.equal(htmlText(null),'');
});
test('inline strings protect quote and backslash boundaries',()=>{
  assert.equal(inlineString("L'Asie\\Japon\n"), "L\\&#39;Asie\\\\Japon\\n");
});
test('images require HTTPS or supported raster data',()=>{
  assert.equal(imageURL('http://example.com/photo.jpg'),'');
  assert.equal(imageURL('https://user:pass@example.com/photo.jpg'),'');
  assert.equal(imageURL('https://example.com/photo.jpg'),'https://example.com/photo.jpg');
  assert.equal(imageURL('data:image/jpeg;base64,YQ=='),'data:image/jpeg;base64,YQ==');
  assert.equal(imageURL('data:image/svg+xml;base64,YQ=='),'');
});
test('notification targets stay in the application',()=>{
  const base='https://tour-dasie.github.io/voyages/';
  assert.equal(notificationURL('?reminder=todo_1',base),base+'?reminder=todo_1');
  assert.equal(notificationURL('https://example.com/',base),base);
  assert.equal(notificationURL('/other/',base),base);
});
test('expense and flight action IDs must be numeric',()=>{
  assert.equal(numericId(123),'123');assert.equal(numericId('123'),'null');
  assert.equal(numericId(-1),'null');assert.equal(numericId(Infinity),'null');
});
