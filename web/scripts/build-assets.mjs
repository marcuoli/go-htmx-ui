import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,rmdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

// Anchor paths to this script so npm --prefix web and direct invocations from
// another working directory build the same assets. Dependencies may live outside
// the checkout; temporary input follows the caller's configured OS temp directory.
const webRoot=fileURLToPath(new URL('../',import.meta.url));
const modules=process.env.GO_HTMX_UI_NODE_MODULES
 ? resolve(process.env.GO_HTMX_UI_NODE_MODULES) : join(webRoot,'node_modules');
const output=join(webRoot,'assets/ui.css');
const scratch=mkdtempSync(join(tmpdir(),'go-htmx-ui-assets-'));
const input=join(scratch,'components.css');
try {
 const reference=JSON.stringify(join(modules,'tailwindcss/index.css').replaceAll('\\','/'));
 writeFileSync(input,readFileSync(join(webRoot,'styles/components.css'),'utf8')
  .replace('@reference "tailwindcss";',`@reference ${reference};`));
 const result=spawnSync(process.execPath,[join(modules,'@tailwindcss/cli/dist/index.mjs'),'-i',input,'-o',output,'--minify'],{cwd:webRoot,stdio:'inherit'});
 if(result.error) throw result.error;
 if(result.status!==0) throw new Error(`Tailwind build failed (${result.status ?? result.signal ?? 'unknown'})`);
 // Tailwind emits fallback initialization and custom property registrations even
 // without preflight. Scope and namespace these too, preserving host CSS isolation.
 const css=readFileSync(output,'utf8').replaceAll('--tw-','--ghtui-tw-').replace(/--(?!ghtui-)([a-z][a-z0-9-]*)/g,'--ghtui-theme-$1').replaceAll('*,:before,:after,::backdrop',':where([class*="ghtui-"]),:where([class*="ghtui-"])::before,:where([class*="ghtui-"])::after,:where([class*="ghtui-"])::backdrop');
 writeFileSync(output,css);
} finally {
 // Delete only the one input file and empty directory created by this build.
 rmSync(input,{force:true});
 rmdirSync(scratch);
}
