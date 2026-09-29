# DoDo · 工作区记忆（给 AI 会话的工作约定与避坑清单）

Windows 桌面待办应用：Tauri 2（Rust 后端 `src-tauri/`）+ 原生 JS 前端（`ui/`，无框架无构建）。
权威文档在思源笔记 DoDo 笔记本（用 siyuan MCP 访问）：需求文档 / UI 设计文档 / 开发工作计划 / 变更记录 / 代码架构说明——改代码后按《变更记录》登记（编号顺延），行号引用以当次登记为准。

## 常用命令

- 启动开发：`npm run dev`（tauri dev，改 ui/ 热更新，改 Rust 自动重编译重启）
- 跑自测（免浏览器）：`node scripts/selftest-harness.js`（当前 20 组用例，必须全过）
- 浏览器自测：ui/index.html 地址加 `?selftest=1`

## 已踩过的坑（不要再犯）

### 思源笔记编辑（siyuan MCP）

1. **段落文本里的半角 `~` 会被解析成下标**：`B1~B10` 会变成 B1<sub>B10</sub>。正文段落用短横线「–」代替；表格单元格内是安全的。
2. **更新标题块必须带 `#`/`##` 前缀**：纯文本写回会把标题降级成普通段落（踩过 5.3/5.4 标题，已恢复）。
3. **列表项（li 块）不能只传纯文本更新**：会报 "NodeList cannot contain NodeParagraph"。要更新整个列表块，并带上 `{: id="..."}` 注记保留原块 ID。
4. **更新表格块要传完整表格**：只传某一行的 markdown 会把整张表覆盖成那一行（踩过：模块 A 表只剩 A9，已恢复）。改一行 = 重发整表。

### tauri-plugin-sql / SQLite

5. **前端无法可靠包事务**：插件的 `execute` 只支持单条预处理语句，且 sqlx 连接池默认多连接——分开调 BEGIN/COMMIT 可能落在不同连接上。批量写事务必须在 Rust 侧做（已有 `sqlite_batch` 命令，单连接事务；前端 `DB.batch` 走它）。
6. **JSON 对象参数要存为 JSON 文本**：前端把对象（如 repeat 规则）直接作为绑定参数传入时，Rust 侧必须 `to_string()` 落库，不能落到 NULL 分支（sqlite_batch 已处理，改它时注意）。

### 业务逻辑（历史 bug，回归时留意）

7. **重复任务结束日期**：`nextOccur` 返回 null（越过结束日）≠「补完成」；`toggleDone` 三分支：null→永久归档、未来→正常复活、今天→最早次日。Toast 里 `fmtDue(t.nextDue)` 必须判空（null 会抛异常）。
8. **思源 `~` 下标坑同样适用于「全角～」**（会被归一化后仍触发），一律用「–」。

## 开发硬约定（详见思源《代码架构说明》第八节）

- 任何 innerHTML 模板插入用户数据必须过 `esc()`
- 新交互用 data-* 全局委托，不在渲染时逐个 addEventListener
- 改表结构：main.rs 新增 Migration(version+1)，前端 mapRow/taskPack 同步字段
- 改 parseQuick / toggleDone 后必须跑 selftest（20 组全过）
