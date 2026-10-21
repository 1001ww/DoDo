// C66:`npm run build` 的包装器——先把 updater 签名私钥注入环境变量,再转调 tauri CLI。
// 为什么不用 prebuild 钩子:npm 各生命周期脚本是独立进程,prebuild 里设的 process.env
// 传不到 build 脚本;这里在同一进程内设好后 spawn 才能继承。
// 私钥位于 ~/.tauri/dodo.key(仅本机,不入库;公钥已写进 tauri.conf.json)。
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const home = process.env.USERPROFILE || process.env.HOME;
const keyPath = path.join(home, '.tauri', 'dodo.key');

if (!process.env.TAURI_SIGNING_PRIVATE_KEY) {
  if (!fs.existsSync(keyPath)) {
    console.error('[DoDo] 未找到 updater 签名私钥: ' + keyPath);
    console.error('       bundle.createUpdaterArtifacts 已开启,没有它 tauri build 会在打包阶段失败。');
    console.error('       生成方式: npx tauri signer generate -w "' + keyPath + '"');
    process.exit(1);
  }
  process.env.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(keyPath, 'utf8').trim();
}
if (!process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD) {
  process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ''; // 本机密钥为空密码
}

const args = process.argv.slice(2); // 透传: npm run build -- --debug 等
const r = spawnSync('npx', ['tauri', ...args], { stdio: 'inherit', shell: true });
process.exit(r.status == null ? 1 : r.status);
