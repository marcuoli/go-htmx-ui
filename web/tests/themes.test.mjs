import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {themeCSS} from '../scripts/theme-css.mjs';

const themes=JSON.parse(fs.readFileSync(new URL('../styles/themes.json',import.meta.url),'utf8'));
const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};

test('every theme has a complete Light/Dark pair and readable semantic defaults',()=>{
 const css=themeCSS(themes);
 assert.match(css,/@media\(prefers-color-scheme:dark\)/);
 for(const [name,pair] of Object.entries(themes))for(const [mode,p] of Object.entries(pair)) {
  for(const key of ['text','muted','success','warning','status-danger'])assert.ok(contrast(p[key],p.surface)>=4.5,`${name}/${mode} ${key} contrast ${contrast(p[key],p.surface)}`);
  assert.ok(contrast(p.primary,p['on-primary'])>=4.5,`${name}/${mode} primary`);
  assert.ok(contrast(p.danger,p['on-danger'])>=4.5,`${name}/${mode} danger`);
  assert.ok(contrast(p.border,p.surface)>=3,`${name}/${mode} control border`);
  assert.ok(contrast(p.accent,p.surface)>=3,`${name}/${mode} focus`);
  for(let i=1;i<=6;i++)assert.ok(contrast(p[`chart-${i}`],p.surface)>=3,`${name}/${mode} chart ${i}`);
 }
});

test('palette build fails closed on missing variants, tokens and CSS fragments',()=>{
 for(const mutate of [p=>delete p.ocean.dark,p=>delete p.forest.light.text,p=>p.standard.dark.text='red;display:none',p=>p.extra=p.standard]) {
  const p=structuredClone(themes);mutate(p);assert.throws(()=>themeCSS(p));
 }
});
