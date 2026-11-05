import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,copyFileSync,rmSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve,isAbsolute} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {themeCSS} from './theme-css.mjs';

const webRoot=fileURLToPath(new URL('../',import.meta.url));
const modules=process.env.GO_HTMX_UI_NODE_MODULES?resolve(process.env.GO_HTMX_UI_NODE_MODULES):join(webRoot,'node_modules');
const args=process.argv.slice(2);let output,promote=args.length===0;
for(let i=0;i<args.length;i++) {
 if(args[i]==='--output-dir' && args[i+1] && isAbsolute(args[i+1]))output=resolve(args[++i]);
 else if(args[i]==='--write-source')promote=true;
 else throw new Error('Use --output-dir ABSOLUTE_PATH and optional --write-source.');
}
// Stage every generated/copied asset in the caller's configured temp/artifact
// directory, then deliberately promote tracked snapshots. No source patching.
const scratch=mkdtempSync(join(tmpdir(),'go-htmx-ui-assets-'));
output=output||join(scratch,'output');mkdirSync(output,{recursive:true});
const input=join(scratch,'components.css');
const sha=path=>createHash('sha256').update(readFileSync(path)).digest('hex');
try {
 const reference=JSON.stringify(join(modules,'tailwindcss/index.css').replaceAll('\\','/'));
 const palettes=JSON.parse(readFileSync(join(webRoot,'styles/themes.json'),'utf8'));
 const styles=readFileSync(join(webRoot,'styles/components.css'),'utf8')+'\n'+themeCSS(palettes)+'\n'+readFileSync(join(webRoot,'styles/layout.css'),'utf8');
 writeFileSync(input,styles.replace('@reference "tailwindcss";',`@reference ${reference};`));
 const result=spawnSync(process.execPath,[join(modules,'@tailwindcss/cli/dist/index.mjs'),'-i',input,'-o',join(output,'ui.css'),'--minify'],{cwd:webRoot,stdio:'inherit'});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`Tailwind build failed (${result.status??result.signal??'unknown'})`);
 const css=readFileSync(join(output,'ui.css'),'utf8').replaceAll('--tw-','--ghtui-tw-').replace(/--(?!ghtui-)([a-z][a-z0-9-]*)/g,'--ghtui-theme-$1').replaceAll('*,:before,:after,::backdrop',':where([class*="ghtui-"]),:where([class*="ghtui-"])::before,:where([class*="ghtui-"])::after,:where([class*="ghtui-"])::backdrop');
 writeFileSync(join(output,'ui.css'),css);
 const manifest=JSON.parse(readFileSync(join(webRoot,'package.json'),'utf8'));
 const lock=JSON.parse(readFileSync(join(webRoot,'package-lock.json'),'utf8'));
 const echarts=JSON.parse(readFileSync(join(modules,'echarts/package.json'),'utf8'));
 const locked=lock.packages['node_modules/echarts'];
 if(echarts.version!==manifest.dependencies.echarts||echarts.version!==locked.version||!locked.integrity||locked.resolved!==`https://registry.npmjs.org/echarts/-/echarts-${echarts.version}.tgz`)throw new Error('Use the exact locked official ECharts package.');
 const files={
  'echarts.min.js':'echarts/dist/echarts.min.js',
  'echarts.LICENSE.txt':'echarts/LICENSE','echarts.NOTICE.txt':'echarts/NOTICE',
  'echarts-d3.LICENSE.txt':'echarts/licenses/LICENSE-d3',
  'zrender.LICENSE.txt':'zrender/LICENSE','tslib.LICENSE.txt':'tslib/LICENSE.txt','tslib.CopyrightNotice.txt':'tslib/CopyrightNotice.txt'
 };
 const hashes={};
 for(const [name,source] of Object.entries(files)) {
  copyFileSync(join(modules,source),join(output,name));
  hashes[name]=sha(join(output,name));
  if(hashes[name]!==sha(join(modules,source)))throw new Error('Upstream asset copy changed bytes.');
 }
 writeFileSync(join(output,'echarts.provenance.json'),JSON.stringify({package:'echarts',version:echarts.version,source:locked.resolved,integrity:locked.integrity,distribution:'dist/echarts.min.js',sha256:hashes},null,2)+'\n');
 if(promote)for(const name of ['ui.css',...Object.keys(files),'echarts.provenance.json'])copyFileSync(join(output,name),join(webRoot,'assets',name));
 process.stdout.write(`ECharts ${echarts.version}: ${readFileSync(join(output,'echarts.min.js')).length} bytes; official assets/notices verified\n`);
} finally {
 rmSync(scratch,{recursive:true,force:true});
}
