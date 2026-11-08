import {readFileSync,copyFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

// Shipped browser runtimes are exact official distributions, not locally built
// or patched dependency sources. The lock and per-file hashes travel with them.
export function copyFrontendAssets({webRoot,modules,output}) {
 const manifest=JSON.parse(readFileSync(join(webRoot,'package.json'),'utf8'));
 const lock=JSON.parse(readFileSync(join(webRoot,'package-lock.json'),'utf8'));
 const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
 const definitions=[
  {directory:'htmx.org',files:{'htmx.min.js':'dist/htmx.min.js','htmx.LICENSE.txt':'LICENSE'}},
  {directory:'htmx4',files:{'htmx4.min.js':'dist/htmx.min.js','htmx4-alpine-compat.min.js':'dist/ext/hx-alpine-compat.min.js','htmx4.LICENSE.txt':'LICENSE'}},
  {directory:'alpinejs',files:{'alpine.min.js':'dist/cdn.min.js'}},
  {directory:'@vue/reactivity',transitive:true,files:{'alpine-vue-reactivity.LICENSE.txt':'LICENSE'}},
  {directory:'@vue/shared',transitive:true,files:{'alpine-vue-shared.LICENSE.txt':'LICENSE'}},
  {directory:'tailwindcss',build:true,files:{'tailwindcss.LICENSE.txt':'LICENSE'}}
 ];
 const files=[],packages=[];
 for(const definition of definitions) {
  const installed=JSON.parse(readFileSync(join(modules,definition.directory,'package.json'),'utf8'));
  const locked=lock.packages['node_modules/'+definition.directory];
  const expected=definition.transitive?locked?.version:(definition.build?manifest.devDependencies:manifest.dependencies)[definition.directory];
  const selected=definition.directory==='htmx4'?'npm:htmx.org@'+installed.version:installed.version;
  const official=`https://registry.npmjs.org/${installed.name}/-/${installed.name.split('/').at(-1)}-${installed.version}.tgz`;
  if(!expected||expected!==selected||locked?.version!==installed.version||locked.resolved!==official||!locked.integrity)throw new Error('Use the exact locked official '+definition.directory+' package.');
  const record={package:installed.name,alias:definition.directory,version:installed.version,source:locked.resolved,integrity:locked.integrity,files:{}};
  for(const [name,source] of Object.entries(definition.files)) {
   const original=join(modules,definition.directory,source);
   copyFileSync(original,join(output,name));
   const hash=sha(join(output,name));
   if(hash!==sha(original))throw new Error('Upstream runtime copy changed bytes.');
   record.files[name]={source,sha256:hash};files.push(name);
  }
  if(definition.directory==='alpinejs') {
   // The npm tarball omits the MIT text. Preserve the exact upstream-tag license
   // as a separate input, with its version/blob/hash checked during every build.
   const license=JSON.parse(readFileSync(join(webRoot,'third_party/alpinejs.LICENSE.provenance.json'),'utf8'));
   const original=join(webRoot,'third_party/alpinejs.LICENSE.md');
   if(license.version!==installed.version||license.source!==`https://raw.githubusercontent.com/alpinejs/alpine/v${installed.version}/LICENSE.md`||!license.gitBlob||sha(original)!==license.sha256)throw new Error('Alpine license provenance does not match the shipped version.');
   copyFileSync(original,join(output,'alpine.LICENSE.txt'));
   record.files['alpine.LICENSE.txt']={source:license.source,gitBlob:license.gitBlob,sha256:license.sha256};files.push('alpine.LICENSE.txt');
  }
  packages.push(record);
 }
 writeFileSync(join(output,'frontend.provenance.json'),JSON.stringify({packages},null,2)+'\n');
 files.push('frontend.provenance.json');
 return files;
}
