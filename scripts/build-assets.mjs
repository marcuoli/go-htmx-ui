import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const result=spawnSync(process.execPath,['node_modules/@tailwindcss/cli/dist/index.mjs','-i','styles/components.css','-o','assets/ui.css','--minify'],{stdio:'inherit'});
if(result.status!==0) process.exit(result.status ?? 1);
// Tailwind emits fallback initialization and custom property registrations even
// without preflight. Scope and namespace those too, so embedding this sheet does
// not change the consuming application's Tailwind properties or global reset.
const css=readFileSync('assets/ui.css','utf8').replaceAll('--tw-','--ghtui-tw-').replace(/--(?!ghtui-)([a-z][a-z0-9-]*)/g,'--ghtui-theme-$1').replaceAll('*,:before,:after,::backdrop',':where([class*="ghtui-"]),:where([class*="ghtui-"])::before,:where([class*="ghtui-"])::after,:where([class*="ghtui-"])::backdrop');
writeFileSync('assets/ui.css',css);
