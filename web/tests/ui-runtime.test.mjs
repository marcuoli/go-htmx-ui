import test from 'node:test';
import assert from 'node:assert/strict';
import {uiFixture} from './ui-fixture.mjs';
const plain=value=>JSON.parse(JSON.stringify(value));

test('HTMX4 settling defers enhancement and chart refresh until the final swap signal',()=>{
 const f=uiFixture(),ctx={};
 f.fire('htmx:before:swap',f.root,{detail:{ctx}});
 const nested=f.root.append(f.app({theme:'ocean',mode:'light',noPersist:true})),controls=f.switcher(nested);
 f.mutate([{type:'childList',addedNodes:[nested]}]);
 assert.equal(nested.dataset.uiResolvedMode,undefined,'runtime modified a fragment that HTMX4 is still settling');
 assert.equal(controls.theme.disabled,true);
 const before=f.root.events.length;
 f.api.setAppearance(f.root,{theme:'forest'});
 assert.equal(f.root.events.length,before,'chart discovery ran before settled attributes were final');
 f.fire('htmx:finally:swap',f.root,{detail:{ctx}});
 assert.equal(nested.dataset.uiResolvedMode,'light');assert.equal(controls.theme.disabled,false);
 assert.equal(f.root.events.length,before+1);assert.equal(f.root.dataset.uiTheme,'forest');
});

test('concurrent HTMX4 swaps wait for their own final signals including canceled tasks',()=>{
 const f=uiFixture(),a={},b={};
 f.fire('htmx:before:swap',f.root,{detail:{ctx:a}});f.fire('htmx:before:swap',f.root,{detail:{ctx:b}});
 const nested=f.root.append(f.app({noPersist:true})),controls=f.switcher(nested);
 f.mutate([{type:'childList',addedNodes:[nested]}]);
 f.fire('htmx:finally:swap',f.root,{detail:{ctx:a}});
 f.fire('htmx:finally:swap',f.root,{detail:{ctx:{}}});
 assert.equal(controls.theme.disabled,true);
 f.fire('htmx:finally:swap',f.root,{detail:{ctx:b}});assert.equal(controls.theme.disabled,false);
});

test('zero-config UI follows the system and keeps explicit modes stable',()=>{
 const f=uiFixture();assert.deepEqual(plain(f.api.getAppearance(f.root)),{theme:'standard',mode:'system',density:'comfortable',resolvedMode:'light'});
 f.media('dark',true);assert.equal(f.root.dataset.uiResolvedMode,'dark');
 f.api.setAppearance(f.root,{mode:'light'});f.media('dark',false);f.media('dark',true);assert.equal(f.root.dataset.uiResolvedMode,'light');
 assert.equal(f.controls.mode.value,'light');
});

test('stored choices restore while malformed/blocked storage retains usable SSR defaults',()=>{
 const f=uiFixture({saved:{theme:'forest',mode:'dark',density:'compact'}});
 assert.equal(f.root.dataset.uiTheme,'forest');assert.equal(f.controls.theme.value,'forest');assert.equal(f.controls.mode.value,'dark');
 f.controls.theme.value='ocean';f.fire('change',f.controls.theme);assert.equal(JSON.parse(f.storage.get('go-htmx-ui:appearance')).theme,'ocean');
 for(const saved of ['{broken','[]','null',JSON.stringify({theme:'__proto__',mode:'bad'})]) {
  const g=uiFixture({saved,initial:{theme:'ocean',mode:'light'}});assert.equal(g.root.dataset.uiTheme,'ocean');assert.equal(g.root.dataset.uiMode,'light');
 }
 const blocked=uiFixture({storageFails:true});assert.doesNotThrow(()=>blocked.api.setAppearance(blocked.root,{theme:'forest',mode:'dark'}));assert.equal(blocked.root.dataset.uiTheme,'forest');
 assert.equal({}.polluted,undefined);
});

test('nested previews stay isolated and inserted controls inherit their owning app',()=>{
 const f=uiFixture({saved:{theme:'forest',mode:'dark'}});
 const nested=f.root.append(f.app({theme:'ocean',mode:'light',noPersist:true})),inner=f.switcher(nested);
 f.mutate([{type:'childList',addedNodes:[nested]}]);
 assert.equal(inner.theme.value,'ocean');assert.equal(inner.mode.value,'light');
 f.api.setAppearance(f.root,{theme:'standard',mode:'system'});assert.equal(inner.theme.value,'ocean');
 const inserted=f.switcher(f.root);f.mutate([{type:'childList',addedNodes:[inserted.group]}]);assert.equal(inserted.theme.value,'standard');
 nested.isConnected=false;f.mutate([{type:'childList',addedNodes:[]}]);
 f.media('dark',true);assert.equal(nested.dataset.uiResolvedMode,'light');
});

test('attribute changes normalize once and repeated initialization does not duplicate global handlers',()=>{
 const f=uiFixture(),before=f.events.change.length;
 f.reloadScript();f.api.init();assert.equal(f.events.change.length,before);
 f.root.dataset.uiTheme='bad';f.root.dataset.uiMode='dark';
 f.mutate([{type:'attributes',target:f.root}]);assert.equal(f.root.dataset.uiTheme,'standard');assert.equal(f.controls.mode.value,'dark');
 const count=f.root.events.length;f.mutate([{type:'attributes',target:f.root}]);assert.equal(f.root.events.length,count);
});

test('responsive menu closes on Escape, restores focus, and exposes navigation on desktop',()=>{
 const f=uiFixture({narrow:true});assert.equal(f.navigation.hidden,true);assert.equal(f.toggle.hidden,false);
 f.fire('click',f.toggle);assert.equal(f.navigation.hidden,false);assert.equal(f.toggle.getAttribute('aria-expanded'),'true');
 f.link.focus();const escape=f.fire('keydown',f.link,{key:'Escape'});assert.equal(escape.prevented,true);assert.equal(f.navigation.hidden,true);assert.equal(f.document.activeElement,f.toggle);
 f.media('narrow',false);assert.equal(f.navigation.hidden,false);assert.equal(f.toggle.hidden,true);
 f.link.focus();f.media('narrow',true);assert.equal(f.navigation.hidden,true);assert.equal(f.document.activeElement,f.toggle);
});

test('mobile shell partials enhance a replaced toggle/header and a nav-only insertion',()=>{
 const f=uiFixture({narrow:true});
 f.shell.children=f.shell.children.filter(node=>node!==f.toggle);f.toggle.isConnected=false;
 const header=f.shell.append(new f.Node()),toggle=header.append(new f.Node({'data-ui-shell-toggle':''},'button'));
 toggle.hidden=true;
 f.mutate([{type:'childList',addedNodes:[header]}]);
 assert.equal(toggle.hidden,false,'replaced header left its Menu control hidden');
 f.fire('click',toggle);assert.equal(f.navigation.hidden,false);
 f.fire('click',toggle);assert.equal(f.navigation.hidden,true);
 f.shell.children=f.shell.children.filter(node=>node!==f.navigation);f.navigation.isConnected=false;
 const navigation=f.shell.append(new f.Node({'data-ui-shell-nav':''}));navigation.hidden=false;
 f.api.init(navigation);
 assert.equal(navigation.hidden,true,'nav-only insertion ignored the enclosing mobile shell state');
});

test('storage synchronization uses each root key and disabled persistence does not overwrite a preview',()=>{
 const f=uiFixture();const nested=f.root.append(f.app({theme:'ocean',mode:'light',noPersist:true}));f.api.init(nested);
 f.storage.set('go-htmx-ui:appearance',JSON.stringify({theme:'forest',mode:'dark'}));f.fire('window:storage',null,{key:'go-htmx-ui:appearance'});
 assert.equal(f.root.dataset.uiTheme,'forest');assert.equal(nested.dataset.uiTheme,'ocean');
});
