import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {copyFrontendAssets} from '../scripts/frontend-assets.mjs';
const webRoot=fileURLToPath(new URL('../',import.meta.url));
const modules=process.env.GO_HTMX_UI_NODE_MODULES||join(webRoot,'node_modules');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

test('embedded frontend runtimes and bundled notices reproduce exact official bytes',()=>{
 const output=mkdtempSync(join(tmpdir(),'go-htmx-ui-frontend-test-'));
 try {
  const names=copyFrontendAssets({webRoot,modules,output});
  for(const name of names)assert.deepEqual(readFileSync(join(output,name)),readFileSync(join(webRoot,'assets',name)),name+' differs from deterministic official snapshot');
  const provenance=JSON.parse(readFileSync(join(output,'frontend.provenance.json'),'utf8'));
  for(const record of provenance.packages){
   assert.match(record.source,/^https:\/\/registry\.npmjs\.org\//);assert.match(record.integrity,/^sha512-/);
   for(const [name,file] of Object.entries(record.files))assert.equal(sha(readFileSync(join(output,name))),file.sha256,name+' provenance hash');
  }
  assert.deepEqual(provenance.packages.slice(0,3).map(p=>[p.alias,p.version]),[['htmx.org','2.0.11'],['htmx4','4.0.1'],['alpinejs','3.17.5']]);
  assert.match(readFileSync(join(output,'alpine.LICENSE.txt'),'utf8'),/Caleb Porzio/);
  assert.ok(names.includes('alpine-vue-reactivity.LICENSE.txt'));assert.ok(names.includes('alpine-vue-shared.LICENSE.txt'));assert.ok(names.includes('tailwindcss.LICENSE.txt'));
 }finally{rmSync(output,{recursive:true});}
});
