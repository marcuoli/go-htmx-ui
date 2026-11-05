// Keep every palette complete: a nested app must reset all inherited colors.
export function themeCSS(palettes) {
 const names=['standard','ocean','forest'];
 const keys=['page','surface','raised','text','muted','border','accent','primary','on-primary','danger','on-danger','success','warning','status-danger',...Array.from({length:6},(_,i)=>`chart-${i+1}`)];
 if(!palettes||Object.keys(palettes).sort().join()!==[...names].sort().join())throw Error('Expected Standard, Ocean and Forest palettes');
 for(const name of names) {
  const pair=palettes[name];
  if(!pair||Object.keys(pair).sort().join()!=='dark,light')throw Error(`Theme ${name} needs Light and Dark`);
  for(const mode of ['light','dark']) {
   const palette=pair[mode];
   if(!palette||Object.keys(palette).sort().join()!==[...keys].sort().join()||Object.values(palette).some(value=>!/^#[0-9a-f]{6}$/i.test(value)))throw Error(`Incomplete/invalid ${name} ${mode} palette`);
  }
 }
 const rule=(selector,palette)=>`${selector}{${keys.map(key=>`--ghtui-${key}:${palette[key]}`).join(';')}}`;
 const selector=name=>`.ghtui-app${name==='standard'?'':`[data-ui-theme="${name}"]`}`;
 const light=names.map(name=>rule(selector(name),palettes[name].light)).join('\n');
 const dark=names.map(name=>rule(`${selector(name)}[data-ui-mode="dark"]`,palettes[name].dark)).join('\n');
 const system=names.map(name=>rule(`${selector(name)}[data-ui-mode="system"]`,palettes[name].dark)).join('\n');
 return `@layer theme {\n${light}\n${dark}\n@media(prefers-color-scheme:dark){${system}}\n}`;
}
