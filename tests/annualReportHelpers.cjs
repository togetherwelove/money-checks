const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function modules(overrides = {}) {
  overrides = {
    'src/components/monthCalendarPager/calendarLayout.ts': { CALENDAR_DAYS_PER_WEEK: 7, CALENDAR_WEEK_ROWS: 6 },
    ...overrides,
  };
  const cache = new Map();
  const root = path.resolve(__dirname, '..');
  function load(name) {
    const file = path.resolve(root, name);
    const key = path.relative(root, file).replaceAll('\\', '/');
    if (key in overrides) return overrides[key];
    if (cache.has(file)) return cache.get(file);
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    const exports = {};
    cache.set(file, exports);
    const source = new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
    const output = ts.transpileModule(source, { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    }}).outputText;
    vm.runInNewContext(output, { exports, Date, Intl, TextEncoder, TextDecoder, Uint8Array, DataView,
      console, setTimeout, clearTimeout, AbortController, require(request) {
        if (request in overrides) return overrides[request];
        if (!request.startsWith('.')) throw Error(`Unexpected dependency: ${request}`);
        const base = path.resolve(path.dirname(file), request);
        const target = [base, `${base}.ts`, `${base}.tsx`].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        return load(target);
      },
    }, { filename: file });
    return exports;
  }
  return load;
}

function hooks() {
  const values = [];
  let cursor = 0, effects = [], dirty = false;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === 'function' ? initial() : initial;
      return [values[index], value => {
        const next = typeof value === 'function' ? value(values[index]) : value;
        if (!Object.is(next, values[index])) { values[index] = next; dirty = true; }
      }];
    },
    useRef(initial) { return values[cursor++] ??= { current: initial }; },
    useMemo(factory, deps) {
      const index = cursor++;
      if (!values[index] || deps.some((dep, i) => !Object.is(dep, values[index].deps[i]))) {
        values[index] = { deps, value: factory() };
      }
      return values[index].value;
    },
    useCallback(callback, deps) { return react.useMemo(() => callback, deps); },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!values[index] || deps.some((dep, i) => dep !== values[index].deps[i])) {
        const previous = values[index];
        values[index] = { deps };
        effects.push(() => { previous?.cleanup?.(); values[index].cleanup = effect(); });
      }
    },
  };
  return { react, render(callback) {
    let result;
    do { cursor = 0; effects = []; dirty = false; result = callback(); effects.forEach(effect => effect()); } while (dirty);
    return result;
  }, unmount() { values.forEach(value => value?.cleanup?.()); } };
}

const entry = (id, extra = {}) => ({ id, date: '2026-01-15', createdAt: '2026-01-15T00:00:00Z',
  type: 'expense', amount: 100, content: '테스트', category: '식비', categoryId: 'food', note: '',
  photoAttachments: [], targetMemberId: 'member-a', targetMemberName: '김이름', ...extra });
const currencyMock = { resolveDisplayCurrency: () => 'KRW' };
module.exports = { modules, hooks, entry, currencyMock };
