import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Logic-level regression tests for actual Astro client scripts, using a tiny DOM
// fixture. These are not browser-rendering, visual, or accessibility tests.
function script(file) {
  const source = fs.readFileSync(file, 'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(source, `client script exists in ${file}`);
  return ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
}
class Element {
  constructor(dataset = {}) { this.dataset = dataset; this.attributes = {}; this.events = {}; this.hidden = false; this.style = {}; this.classes = new Set(); this.classList = { toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name) }; }
  setAttribute(key, value) { this.attributes[key] = value; }
  removeAttribute(key) { delete this.attributes[key]; }
  addEventListener(name, fn) { this.events[name] = fn; }
  click() { this.events.click?.(); }
  focus(options) { this.focused = options; }
}
function filterFixture(initial = 'http://example.test/') {
  const buttons = ['', 'AI', '游戏开发'].map(tag => new Element({tag}));
  const cards = [['AI'], ['AI', '游戏开发'], ['游戏开发']].map(tags => new Element({tags: JSON.stringify(tags)}));
  const empty = new Element(); const status = new Element(); const reset = new Element();
  const entries = [initial]; let index = 0;
  const window = { location: new URL(initial), events: {}, addEventListener(name, fn) { this.events[name] = fn; }, history: { pushState(_a,_b,url) { entries.splice(++index); entries.push(url.href); window.location = new URL(url); } } };
  const document = {
    querySelectorAll(selector) { return selector === '.tag-filter__button' ? buttons : cards; },
    querySelector(selector) { return {'.posts-empty':empty,'.filter-status':status,'[data-reset-filter]':reset}[selector]; }
  };
  vm.runInNewContext(script('src/pages/index.astro'), {document, window, URL, URLSearchParams});
  return {buttons,cards,status,empty,reset,entries,window,back() { window.location = new URL(entries[--index]); window.events.popstate(); },forward() { window.location = new URL(entries[++index]); window.events.popstate(); }};
}

test('all posts are visible initially; repeated tag selection is idempotent', () => {
  const f = filterFixture();
  assert.equal(f.cards.filter(x=>!x.hidden).length,3);
  f.buttons[1].click(); f.buttons[1].click();
  assert.equal(f.cards.filter(x=>!x.hidden).length,2);
  assert.equal(f.buttons[1].attributes['aria-pressed'],'true');
  assert.equal(f.entries.length,2);
  assert.equal(f.status.textContent,'AI：2 篇文章');
  assert.equal(f.empty.hidden,true);
});
test('filter URLs support Back, Forward, and reset without losing hash', () => {
  const f=filterFixture('http://example.test/#essays-heading');
  f.buttons[1].click(); f.buttons[2].click(); f.back();
  assert.equal(f.buttons[1].attributes['aria-pressed'],'true');
  f.forward(); assert.equal(f.buttons[2].attributes['aria-pressed'],'true');
  assert.equal(f.window.location.hash,'#essays-heading');
  f.reset.click(); assert.equal(f.cards.filter(x=>!x.hidden).length,3);
  assert.equal(f.window.location.search,'');
});
test('deep-linked Chinese tags initialize and unknown tag safely shows all', () => {
  const f=filterFixture('http://example.test/?tag='+encodeURIComponent('游戏开发'));
  assert.equal(f.buttons[2].attributes['aria-pressed'],'true');
  assert.equal(f.cards.filter(x=>!x.hidden).length,2);
  const invalid=filterFixture('http://example.test/?tag=does-not-exist');
  assert.equal(invalid.cards.filter(x=>!x.hidden).length,3);
  assert.equal(invalid.buttons[0].attributes['aria-pressed'],'true');
});
test('TOC decodes Chinese hashes, follows scroll, closes mobile disclosure and focuses target', () => {
  const target1 = new Element(); target1.top = 100;
  const target2 = new Element(); target2.top = 400;
  for (const node of [target1,target2]) node.getBoundingClientRect = () => ({top:node.top});
  const links = ['概览','details'].map(id => Object.assign(new Element(),{hash:'#'+encodeURIComponent(id)}));
  const details={open:true}; const mobile=Object.assign(new Element(),{hash:'#'+encodeURIComponent('概览'),closest:()=>details});
  const document={querySelectorAll:selector=>selector.includes('__desktop')?links:[mobile],getElementById:id=>({'概览':target1,details:target2}[id])};
  const window={events:{},addEventListener(name,fn){this.events[name]=fn;}};
  vm.runInNewContext(script('src/components/ArticleToc.astro'),{document,window,requestAnimationFrame:fn=>fn()});
  assert.equal(links[0].attributes['aria-current'],'location');
  target2.top=80; window.events.scroll();
  assert.equal(links[1].attributes['aria-current'],'location');
  mobile.click(); assert.equal(details.open,false); assert.equal(target1.attributes.tabindex,'-1'); assert.equal(target1.focused.preventScroll,true);
});
test('reading progress is clamped and updates after content resize', async () => {
  const bar=new Element(); let top=500, height=2000; const callbacks={};
  const article={getBoundingClientRect:()=>({top:top-window.scrollY}),get offsetHeight(){return height;}};
  const window={scrollY:0,innerHeight:800,addEventListener(name,fn){callbacks[name]=fn;},ResizeObserver:true};
  let resize;
  const document={querySelector:selector=>selector.includes('__bar')?bar:article,fonts:{ready:Promise.resolve()}};
  vm.runInNewContext(script('src/components/ReadingProgress.astro'),{document,window,ResizeObserver:class {constructor(fn){resize=fn;}observe(){}}});
  assert.equal(bar.style.width,'0%');
  window.scrollY=1100; callbacks.scroll(); assert.equal(bar.style.width,'50%');
  window.scrollY=3000; callbacks.scroll(); assert.equal(bar.style.width,'100%');
  height=4000; resize(); assert.ok(parseFloat(bar.style.width)<100);
  height=200; resize(); assert.equal(bar.style.width,'100%');
});

test('donut chart and HTML legends share the unchanged original proportions', () => {
  const source = fs.readFileSync('src/data/profit-chart.ts', 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports });
  const charts = JSON.parse(JSON.stringify(exports.PROFIT_CHARTS));
  assert.deepEqual(charts.map(chart => chart.values.map(item => item.value)), [[55,24,12,9],[52,25,14,9]]);
  assert.ok(charts.every(chart => chart.values.reduce((sum,item) => sum+item.value,0) === 100));
  const component = fs.readFileSync('src/components/charts/ProfitDonutChart.astro', 'utf8');
  assert.match(component, /<ul class="profit-legend"/);
  assert.match(component, /font-size: 14px/);
  assert.doesNotMatch(component, /append\("text"\)/);
});
