import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

test('asset build cleans scratch when output directory creation fails',()=>{
 const root=mkdtempSync(join(tmpdir(),'go-htmx-ui-build-test-'));
 try {
  const output=join(root,'existing-file');
  const original=Buffer.from('preserve the output file\n');
  writeFileSync(output,original);
  const result=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/build-assets.mjs',import.meta.url)),'--output-dir',output],{
   env:{...process.env,TEMP:root,TMP:root,TMPDIR:root},encoding:'utf8'
  });
  assert.ifError(result.error);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/EEXIST/);
  assert.deepEqual(readFileSync(output),original);
  assert.deepEqual(readdirSync(root),['existing-file']);
 }finally{rmSync(root,{recursive:true});}
});
