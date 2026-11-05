import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackFixture} from './feedback-fixture.mjs';

test('text-only toast defaults persist, normalize tones and announce on the primed channel',()=>{
 const f=feedbackFixture(),toast=f.feedback.toast({message:'<img onerror=unsafe()>',tone:'bad'});
 assert.equal(toast.dataset.uiTone,'info');assert.equal(toast.dataset.uiDuration,'0');assert.equal(f.timers.size,0);
 assert.ok(toast.textContent.includes('<img onerror=unsafe()>'));assert.equal(toast.querySelectorAll('img').length,0);
 assert.ok(f.pageRegion.polite.textContent.includes('<img onerror=unsafe()>'));
 const urgent=f.feedback.toast({message:'Retry required',tone:'danger'});assert.ok(f.pageRegion.assertive.textContent.includes('Retry required'));
 f.tick(999999);assert.equal(toast.isConnected,true);assert.equal(urgent.isConnected,true);
 f.feedback.dismiss(toast);assert.equal(toast.isConnected,false);
});

test('toast lifetime pauses for hover, keyboard focus and background pages',()=>{
 const f=feedbackFixture(),toast=f.feedback.toast({message:'Saved',duration:5000});
 f.tick(2000);f.fire('pointerover',toast,{relatedTarget:null});f.tick(10000);assert.equal(toast.isConnected,true);
 f.fire('pointerout',toast,{relatedTarget:null});f.tick(1000);
 const close=toast.querySelector('[data-ui-message-dismiss]');close.focus();f.fire('focusin',close);f.tick(10000);assert.equal(toast.isConnected,true);
 f.link.focus();f.fire('focusout',close);f.flush();f.tick(1000);
 f.document.hidden=true;f.fire('visibilitychange',f.document);f.tick(10000);assert.equal(toast.isConnected,true);
 f.document.hidden=false;f.fire('visibilitychange',f.document);f.tick(999);assert.equal(toast.isConnected,true);f.tick(1);assert.equal(toast.isConnected,false);
});

test('removed toast timers are cleaned and repeated init does not restart or announce twice',()=>{
 const f=feedbackFixture(),toast=f.feedback.toast({message:'First',duration:1000});
 f.tick(500);f.feedback.init();assert.equal(f.timers.size,1);f.tick(500);assert.equal(toast.isConnected,false);
 const second=f.feedback.toast({message:'Second',duration:1000});second.remove();f.mutate([{type:'childList',addedNodes:[]}]);assert.equal(f.timers.size,0);
 const count=f.events.click.length;f.reloadFeedback();assert.equal(f.events.click.length,count);
});

test('modal controls preserve native closing values and focus, including rapid reopen',()=>{
 const f=feedbackFixture(),dialog=f.root.append(new f.Node({id:'edit','data-ui-modal':''},'dialog'));
 const trigger=f.root.append(new f.Node({'data-ui-modal-open':'edit','data-ui-modal-enable':''},'button'));trigger.disabled=true;
 f.feedback.init(trigger);assert.equal(trigger.disabled,false);trigger.focus();f.fire('click',trigger);assert.equal(dialog.open,true);
 const close=dialog.append(new f.Node({'data-ui-modal-close':'cancel'},'button'));close.focus();f.fire('click',close);f.flush();assert.equal(dialog.returnValue,'cancel');assert.equal(f.document.activeElement,trigger);
 f.feedback.openModal(dialog);f.feedback.closeModal(dialog);f.feedback.openModal(dialog,trigger);f.flush();assert.equal(dialog.open,true);
 f.feedback.closeModal(dialog);f.flush();assert.equal(f.document.activeElement,trigger);
});

test('default region stays on the page or in the active modal, never in a closed modal',()=>{
 const f=feedbackFixture(),dialog=f.root.append(new f.Node({id:'edit','data-ui-modal':''},'dialog')),local=f.region(dialog);
 const first=f.feedback.toast({message:'Page'});assert.equal(first.closest('[data-ui-toast-region]'),f.pageRegion.root);
 f.feedback.openModal(dialog);const second=f.feedback.toast({message:'Modal'});assert.equal(second.closest('[data-ui-toast-region]'),local.root);
 f.feedback.closeModal(dialog);f.flush();const third=f.feedback.toast({message:'Page again'});assert.equal(third.closest('[data-ui-toast-region]'),f.pageRegion.root);
 dialog.remove();f.mutate([{type:'childList',addedNodes:[]}]);
 assert.throws(()=>f.feedback.toast({},local.root),/connected ToastRegion/);
});

test('HTMX4 settling holds trigger enhancement and server toast timers until final swap',()=>{
 const f=feedbackFixture(),ctx={};f.fire('htmx:before:swap',f.root,{detail:{ctx}});
 const trigger=f.root.append(new f.Node({'data-ui-modal-enable':''},'button'));trigger.disabled=true;
 const toast=f.pageRegion.items.append(new f.Node({'data-ui-toast':'','data-ui-duration':'1000'}));
 f.mutate([{type:'childList',addedNodes:[trigger,toast]}]);assert.equal(trigger.disabled,true);assert.equal(f.timers.size,0);
 f.fire('htmx:finally:swap',f.root,{detail:{ctx}});assert.equal(trigger.disabled,false);assert.equal(f.timers.size,1);
});

test('reopening an older modal makes its region the active top layer',()=>{
 const f=feedbackFixture(),a=f.root.append(new f.Node({id:'a','data-ui-modal':''},'dialog')),b=f.root.append(new f.Node({id:'b','data-ui-modal':''},'dialog'));
 const ar=f.region(a);f.region(b);f.feedback.openModal(a);f.feedback.openModal(b);f.feedback.closeModal(a);f.feedback.openModal(a);
 const toast=f.feedback.toast({message:'Top layer'});assert.equal(toast.closest('[data-ui-toast-region]'),ar.root);
});

test('closed-modal toasts wait for visibility and preserve remaining time across close/reopen',()=>{
 const f=feedbackFixture(),dialog=f.root.append(new f.Node({id:'a','data-ui-modal':''},'dialog')),region=f.region(dialog);
 const toast=region.items.append(new f.Node({'data-ui-toast':'','data-ui-duration':'5000'})),text=toast.append(new f.Node({'data-ui-message-text':''}));text.textContent='Visible only';
 f.feedback.init(dialog);assert.equal(f.timers.size,0);assert.equal(region.polite.textContent,'');f.tick(10000);assert.equal(toast.isConnected,true);
 f.feedback.openModal(dialog);assert.equal(f.timers.size,1);assert.equal(region.polite.textContent,'Visible only');f.tick(2000);f.feedback.closeModal(dialog);f.flush();
 f.tick(10000);assert.equal(toast.isConnected,true);f.feedback.openModal(dialog);f.tick(2999);assert.equal(toast.isConnected,true);f.tick(1);assert.equal(toast.isConnected,false);
});

test('dismissal ignores a disconnected opener and focuses a remaining control',()=>{
 const f=feedbackFixture(),toast=f.feedback.toast({message:'Dismiss me'}),close=toast.querySelector('[data-ui-message-dismiss]');
 // Set an actual opener on a fresh toast, then remove it before dismissal.
 f.feedback.dismiss(toast);const opener=f.root.append(new f.Node({},'button'));opener.focus();
 const next=f.feedback.toast({message:'Dismiss next'});opener.remove();next.querySelector('[data-ui-message-dismiss]').focus();
 f.feedback.dismiss(next);assert.equal(f.document.activeElement.isConnected,true);assert.equal(f.document.activeElement.closest('[data-ui-toast]'),null);
});

test('backdrop dismissal requires a fresh primary press beginning outside',()=>{
 const f=feedbackFixture(),dialog=f.root.append(new f.Node({id:'a','data-ui-modal':'','data-ui-modal-backdrop':'true'},'dialog'));
 dialog.getBoundingClientRect=()=>({left:100,right:500,top:100,bottom:500});f.feedback.openModal(dialog);
 f.fire('pointerdown',dialog,{button:2,clientX:0,clientY:0});
 f.fire('pointerdown',dialog,{button:0,clientX:200,clientY:200});f.fire('click',dialog,{clientX:0,clientY:0});assert.equal(dialog.open,true);
 f.fire('pointerdown',dialog,{button:0,clientX:0,clientY:0});f.fire('pointercancel',dialog);f.fire('click',dialog,{clientX:0,clientY:0});assert.equal(dialog.open,true);
 f.fire('pointerdown',dialog,{button:0,clientX:0,clientY:0});f.fire('click',dialog,{clientX:0,clientY:0});assert.equal(dialog.open,false);
});

test('modal return focus accepts an explicit programmatic tabindex minus-one opener',()=>{
 const f=feedbackFixture(),dialog=f.root.append(new f.Node({id:'a','data-ui-modal':''},'dialog'));
 const heading=f.root.append(new f.Node({'tabindex':'-1'},'h2'));heading.tabIndex=-1;
 f.feedback.openModal(dialog,heading);f.feedback.closeModal(dialog);f.flush();assert.equal(f.document.activeElement,heading);
});
