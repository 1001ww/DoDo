// 自测脚本:在 node vm 沙箱中加载 ui/app.js 并运行全部用例(免浏览器,等价于 ?selftest=1)
// 用法:node scripts/selftest-harness.js   (退出码 0 = 全部通过)
const fs = require('fs'), vm = require('vm'), path = require('path');
const code = fs.readFileSync(path.join(__dirname, '..', 'ui', 'app.js'), 'utf8');

const el = () => ({
  innerHTML: '', value: '', textContent: '', style: {}, dataset: {}, onclick: null,
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  addEventListener() {}, removeEventListener() {}, focus() {}, select() {}, blur() {},
  appendChild() {}, remove() {}, setAttribute() {}, isConnected: true,
  querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 }),
});
const documentStub = {
  querySelector: s => (typeof s === 'string' && s.indexOf('.task-row') === 0) ? null : el(),
  querySelectorAll: () => [],
  getElementById: () => null,
  createElement: () => el(),
  addEventListener() {}, removeEventListener() {},
  documentElement: { dataset: {}, classList: { add() {}, remove() {} } },
  body: { appendChild() {} },
  hidden: false,
};
const sandbox = {
  window: {}, document: documentStub,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { search: '' }, matchMedia: () => ({ matches: false, addEventListener() {} }),
  innerWidth: 1200, innerHeight: 800,
  console, setTimeout, clearTimeout, setInterval: () => 0, clearInterval() {},
  URL: { createObjectURL: () => '', revokeObjectURL() {} }, Blob: function () {},
};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'app.js' });
const fails = vm.runInContext('runParseTests()', sandbox);
if (fails.length) {
  console.error('FAILED:\n' + fails.join('\n'));
  process.exit(1);
}
console.log('parseQuick 自测: 20/20 通过');
