const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
function load(file, dependencies, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,
    { exports, ...globals, require(name) { if(name in dependencies)return dependencies[name]; throw Error(name); } });
  return exports;
}
function host() {
  const hooks=[]; let cursor=0, effects=[], dirty=false;
  const same=(a,b)=>a&&b&&a.length===b.length&&a.every((x,i)=>Object.is(x,b[i]));
  const react={
    useRef(value){return hooks[cursor++]??={current:value};},
    useState(initial){const key=cursor++;if(!(key in hooks))hooks[key]=typeof initial==='function'?initial():initial;return [hooks[key],value=>{const next=typeof value==='function'?value(hooks[key]):value;if(!Object.is(next,hooks[key])){hooks[key]=next;dirty=true;}}];},
    useMemo(fn,deps){const key=cursor++;if(!same(hooks[key]?.deps,deps))hooks[key]={deps,value:fn()};return hooks[key].value;},
    useCallback(fn,deps){return react.useMemo(()=>fn,deps);},
    useEffect(fn,deps){const key=cursor++;if(!same(hooks[key]?.deps,deps)){const old=hooks[key];hooks[key]={deps};effects.push(()=>{old?.cleanup?.();hooks[key].cleanup=fn();});}},
  };
  return {react,render(fn){let result,count=0;do{dirty=false;cursor=0;effects=[];result=fn();effects.forEach(fn=>fn());assert.ok(++count<20);}while(dirty);return result;},dispose(){hooks.forEach(h=>h?.cleanup?.());}};
}
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const tick=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
const category=(id)=>({id,label:id,iconName:'circle',source:'custom',type:'expense'});
const clone=value=>JSON.parse(JSON.stringify(value));
function environment() {
  const disk=new Map(), server=new Map(), orders=new Map(), reads=[], writes=[], subscribers=new Set(), timers=new Map();let timerId=0;
  let nextRead, nextWrite, removed=0;
  const copy=load('src/constants/categoryCustomizer.ts',{});
  const storage=load('src/lib/categoryCustomizationStorage.ts',{'../constants/categoryCustomizer':copy,'./appStorage':{appStorage:{getItem:k=>disk.get(k)??null,setItem:(k,v)=>disk.set(k,v)}}});
  const custom=load('src/lib/customCategories.ts',{'../constants/categoryCustomizer':copy});
  const sessions=load('src/lib/categorySaveSession.ts',{});
  const backend={
    async fetchLedgerBookCategoryCustomization(book,type){
      reads.push([book,type]);
      if(nextRead){const read=nextRead;nextRead=null;return await read;}
      return snapshot(book,type);
    },
    async replaceLedgerBookCustomCategories(book,type,categories,order){
      writes.push([book,type,clone(categories)]);
      if(nextWrite){const write=nextWrite;nextWrite=null;await write;}
      server.set(book+type,clone(categories));orders.set(book+type,clone(order));
    },
    replaceLedgerBookSystemCategoryCustomizations:async()=>{},
    logLedgerBookCategorySyncError:()=>{},
    subscribeToLedgerBookCategoryChanges({onChange}){subscribers.add(onChange);return ()=>{subscribers.delete(onChange);removed++;};},
  };
  function snapshot(book='book-a',type='expense'){return {categoryOrderIds:orders.get(book+type)??[],customCategories:(server.get(book+type)??[]).map(c=>({...c,source:'custom',type})),hiddenSystemCategoryIds:[],systemCategoryIconOverrides:{},systemCategoryLabelOverrides:{}};}
  function mount(book='book-a',type='expense'){
    const h=host();let state;const props={book,type};
    const {useCustomCategories}=load('src/hooks/useCustomCategories.ts',{
      react:h.react,'../lib/categorySaveSession':sessions,'../lib/categoryCustomizationStorage':storage,'../lib/customCategories':custom,'../lib/ledgerBookCategories':backend,
      '../constants/categorySelector':{CATEGORY_ORDER_SAVE_DEBOUNCE_MS:10,CATEGORY_SHARED_REFRESH_DEBOUNCE_MS:10},
    },{setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id)});
    const render=()=>state=h.render(()=>useCustomCategories(props.type,props.book));render();
    return {props,render,get state(){return state;},async settle(){await tick();render();},dispose:h.dispose};
  }
  return {mount,storage,server,writes,reads,snapshot,delayRead(p){nextRead=p;},delayWrite(p){nextWrite=p;},notify(){subscribers.forEach(fn=>fn());},flushTimers(){const fns=[...timers.values()];timers.clear();fns.forEach(fn=>fn());},get removed(){return removed;}};
}
test('confirmed addition survives hook restart, server reload and offline cache reload',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();
  assert.equal(await ui.state.saveCustomCategories([category('교통비')]),true);ui.render();
  assert.equal(ui.state.customCategories[0].label,'교통비');ui.dispose();
  const restarted=e.mount();assert.equal(restarted.state.customCategories[0].label,'교통비');await restarted.settle();assert.equal(restarted.state.customCategories.length,1);
  restarted.dispose();const read=deferred();e.delayRead(read.promise);const offline=e.mount();read.reject(Error('offline'));await offline.settle();assert.equal(offline.state.customCategories[0].label,'교통비');offline.dispose();assert.equal(e.removed,3);
});
test('failed server save is not published or cached and can be retried',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();const write=deferred();e.delayWrite(write.promise);
  const result=ui.state.saveCustomCategories([category('new')]);ui.render();assert.equal(ui.state.isSavingCategories,true);assert.equal(ui.state.customCategories.length,0);
  write.reject(Error('permission denied'));assert.equal(await result,false);ui.render();assert.equal(ui.state.isSavingCategories,false);assert.equal(e.storage.loadStoredCustomCategories('expense','book.book-a').length,0);
  assert.equal(await ui.state.saveCustomCategories([category('new')]),true);ui.render();assert.equal(ui.state.customCategories.length,1);
});
test('stale refresh finishing after addition cannot erase the confirmed category',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();const read=deferred();e.delayRead(read.promise);e.notify();e.flushTimers();
  assert.equal(await ui.state.saveCustomCategories([category('new')]),true);
  read.resolve(e.snapshot('missing'));await ui.settle();assert.equal(ui.state.customCategories.length,1);assert.equal(e.storage.loadStoredCustomCategories('expense','book.book-a').length,1);
});
test('initial load blocks replacing existing remote categories with an empty local snapshot',async()=>{
  const e=environment();e.server.set('book-aexpense',[category('remote')]);const read=deferred();e.delayRead(read.promise);const ui=e.mount();
  assert.equal(ui.state.isLoadingCategories,true);assert.equal(await ui.state.saveCustomCategories([category('new')]),false);assert.equal(e.writes.length,0);
  read.resolve(e.snapshot());await ui.settle();assert.equal(ui.state.customCategories[0].id,'remote');
});
test('failed initial fetch can be retried without restarting the app',async()=>{
  const e=environment(),read=deferred();e.delayRead(read.promise);const ui=e.mount();read.reject(Error('offline'));await ui.settle();assert.equal(ui.state.isLoadingCategories,false);
  assert.equal(await ui.state.saveCustomCategories([category('new')]),false);ui.render();await ui.settle();assert.equal(await ui.state.saveCustomCategories([category('new')]),true);
});
test('duplicate submit is rejected while a save is pending',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();const write=deferred();e.delayWrite(write.promise);const first=ui.state.saveCustomCategories([category('new')]);
  assert.equal(await ui.state.saveCustomCategories([category('duplicate')]),false);write.resolve();assert.equal(await first,true);assert.equal(e.writes.length,1);
});
test('queued order save uses the confirmed list instead of deleting the new category',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();const write=deferred();e.delayWrite(write.promise);const save=ui.state.saveCustomCategories([category('new')]);const order=ui.state.saveCategoryOrderIds(['new']);await tick();assert.equal(e.writes.length,1);
  write.resolve();await save;assert.equal(await order,true);await ui.settle();assert.equal(e.writes.length,2);assert.equal(e.server.get('book-aexpense')[0].id,'new');
});
test('switching books during save cannot publish the previous book category in the next book',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();const write=deferred();e.delayWrite(write.promise);const save=ui.state.saveCustomCategories([category('old-book')]);await tick();
  ui.props.book='book-b';ui.render();await ui.settle();write.resolve();assert.equal(await save,false);ui.render();assert.equal(ui.state.customCategories.length,0);assert.equal(e.storage.loadStoredCustomCategories('expense','book.book-a').length,1);assert.equal(e.storage.loadStoredCustomCategories('expense','book.book-b').length,0);
});
test('local-only categories persist separately for income and expense',async()=>{
  const e=environment(),expense=e.mount(null,'expense');await expense.settle();assert.equal(await expense.state.saveCustomCategories([category('local')]),true);expense.dispose();
  const restart=e.mount(null,'expense'),income=e.mount(null,'income');assert.equal(restart.state.customCategories[0].id,'local');assert.equal(income.state.customCategories.length,0);assert.equal(e.writes.length,0);
});

for (const entryType of ['expense', 'income']) test(`settings ${entryType} form validates and preserves failed input until save succeeds`,async()=>{
  const h=host(),copy=load('src/constants/categoryCustomizer.ts',{}),custom=load('src/lib/customCategories.ts',{'../constants/categoryCustomizer':copy});
  let saveResult=false,closed=false,saved,saveCount=0,scope;
  const jsx=(type,props)=>({type,props});
  const dependencies={
    react:h.react,'react/jsx-runtime':{jsx,jsxs:jsx},
    'react-native':{Text:'Text',View:'View',StyleSheet:{create:s=>s}},
    '../../constants/categoryCustomizer':copy,
    '../../constants/appSettings':{AppSettingsCopy:{},AppSettingsUi:{}},
    '../../constants/appSettingsStyles':{AppSettingsRowStyles:{}},
    './SettingsCategoryOrderModal':{SettingsCategoryOrderModal:'SettingsCategoryOrderModal'},
    '../../constants/colors':{AppColors:{}},'../AppIcons':{Feather:'Feather'},
    '../../constants/categories':{CATEGORY_OPTIONS:{expense:[{id:'base',label:'기본'}],income:[{id:'base',label:'기본'}]}},
    '../../constants/layout':{AppLayout:{}},'../../constants/uiStyles':{},'../../lib/customCategories':custom,
    '../../hooks/useCustomCategories':{useCustomCategories:(type,book)=>{scope=[type,book];return {customCategories:[category('기존')],systemCategoryLabelOverrides:{base:'수정한 기본'},saveCustomCategories:async(next)=>{saved=next;saveCount++;return saveResult;}};}},
    '../ActionButton':{ActionButton:'ActionButton'},'../categorySelector/CategoryCreateModal':{CategoryCreateModal:'CategoryCreateModal'},
  };
  const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/appSettings/SettingsCategoryCreateModal.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>{if(name in dependencies)return dependencies[name];throw Error(name);}});
  const render=()=>h.render(()=>exports.SettingsCategoryCreateModal({categories:dependencies['../../hooks/useCustomCategories'].useCustomCategories(entryType,'book-a'),entryType,onClose:()=>{closed=true;}}));
  let form=render();await form.props.onSubmit();assert.equal(saveCount,0);
  form.props.onChangeLabel('수정한 기본');form=render();await form.props.onSubmit();assert.equal(saveCount,0);
  form.props.onChangeLabel('새 분류');form=render();
  await form.props.onSubmit();form=render();
  assert.equal(form.props.isOpen,true);assert.equal(form.props.label,'새 분류');assert.equal(form.props.errorMessage,copy.CategoryCustomizerCopy.saveError);
  assert.equal(closed,false);assert.deepEqual(scope,[entryType,'book-a']);
  saveResult=true;await form.props.onSubmit();assert.equal(closed,true);
  assert.equal(saved.length,2);assert.equal(saved[0].id,'기존');assert.equal(saved[1].type,entryType);
});

test('order saves immediately, survives closing the screen and reloads after restart',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();await ui.state.saveCustomCategories([category('first'),category('second')]);ui.render();
  const write=deferred();e.delayWrite(write.promise);let finished=false;const save=ui.state.saveCategoryOrderIds(['second','first']).then(result=>{finished=true;return result;});
  await tick();assert.equal(finished,false);assert.equal(e.storage.loadStoredCategoryOrderIds('expense','book.book-a').length,0);
  write.resolve();assert.equal(await save,true);ui.dispose();
  const restarted=e.mount();await restarted.settle();assert.deepEqual(Array.from(restarted.state.categoryOrderIds),['second','first']);
});
test('failed order save reports failure, retains the confirmed order and permits retry',async()=>{
  const e=environment(),ui=e.mount();await ui.settle();await ui.state.saveCustomCategories([category('first'),category('second')]);ui.render();
  await ui.state.saveCategoryOrderIds(['first','second']);ui.render();
  const write=deferred();e.delayWrite(write.promise);const save=ui.state.saveCategoryOrderIds(['second','first']);write.reject(Error('offline'));assert.equal(await save,false);ui.render();
  assert.deepEqual(Array.from(ui.state.categoryOrderIds),['first','second']);assert.deepEqual(Array.from(e.storage.loadStoredCategoryOrderIds('expense','book.book-a')),['first','second']);
  assert.equal(await ui.state.saveCategoryOrderIds(['second','first']),true);
});

test('category manager tabs protect unsaved order and disable changes during saving',async()=>{
  const h=host(),changes=[],alerts=[],save=deferred();let added=0;
  const jsx=(type,props)=>({type,props});
  const props={entryType:'expense',onChangeEntryType:value=>changes.push(value),onAdd:()=>added++,creationModal:{type:'CreateModal',props:{}},categories:[category('first'),category('second')],isOpen:true,onClose:()=>{},onChangeOrder:()=>save.promise};
  const {CategoryManageModal}=load('src/components/categorySelector/CategoryManageModal.tsx',{
    '../NativeSelectionSheet': { NativeSelectionSheet: 'Sheet' },
    react:h.react,'react/jsx-runtime':{jsx,jsxs:jsx},
    'react-native':{Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:s=>s},Alert:{alert:(...args)=>alerts.push(args)}},
    '../AppIcons':{Feather:'Feather'},'./CategoryTypeTabs':{CategoryTypeTabs:'Tabs'},'../ActionButton':{ActionButton:'ActionButton'},'../ModalCloseButton':{ModalCloseButton:'ModalCloseButton'},
    '../../constants/scroll':{},'../../constants/categoryCustomizer':load('src/constants/categoryCustomizer.ts',{}),
    '../../constants/categorySelector':{},'../../constants/colors':{AppColors:{}},'../../constants/layout':{AppLayout:{}},'../../constants/uiStyles':{},
  },{setTimeout:()=>1,clearTimeout:()=>{}});
  function nodes(root){return !root||typeof root!=='object'?[]:[root,...[root.props?.children].flat(Infinity).flatMap(nodes)];}
  let tree;const render=()=>{tree=h.render(()=>CategoryManageModal(props));return nodes(tree);};
  let all=render();all.find(n=>n.type==='Tabs').props.onChange('income');assert.deepEqual(changes,['income']);changes.length=0;
  all.find(n=>n.props?.label==='아래로').props.onPress();all=render();all.find(n=>n.type==='Tabs').props.onChange('income');
  assert.equal(alerts.length,1);assert.equal(changes.length,0);alerts[0][2][1].onPress();assert.deepEqual(changes,['income']);
  const saveButton=all.find(n=>n.type==='Pressable' && n.props.children?.props?.children==='저장');saveButton.props.onPress();all=render();
  assert.equal(all.find(n=>n.type==='Tabs').props.disabled,true);assert.equal(all.find(n=>n.type==='ActionButton').props.disabled,true);
  save.resolve(false);await tick();all=render();assert.equal(all.find(n=>n.type==='Tabs').props.disabled,false);
  props.entryType='income';props.categories=[{...category('salary'),type:'income'}];all=render();
  assert.equal(all.find(n=>n.type==='Tabs').props.value,'income');assert.equal(all.filter(n=>n.props?.category).length,1);
});
