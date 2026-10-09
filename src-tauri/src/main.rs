// 阻止 Windows release 构建弹出控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconEvent,
    Emitter, Listener, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use std::os::windows::process::CommandExt;
use sqlx::{Column, Row};

const APP_ID: &str = "com.dodo.todo";
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

const INIT_SQL: &str = "
CREATE TABLE IF NOT EXISTS tasks(
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  note TEXT DEFAULT '',
  list TEXT,
  tags TEXT DEFAULT '[]',
  prio INTEGER DEFAULT 0,
  due TEXT,
  time TEXT,
  remind TEXT,
  repeat TEXT,
  done INTEGER DEFAULT 0,
  doneAt TEXT,
  subs TEXT DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS lists(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  sort INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS meta(
  key TEXT PRIMARY KEY,
  value TEXT
);
";

fn show_main(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    }
}

/// 注册通知用的应用身份(AppUserModelId):显示名 DoDo + 应用图标。
/// 未打包运行时插件会退回 PowerShell 身份,这里自行注册后即可显示自己的名字与图标。
fn register_aumid(app: &tauri::AppHandle) {
    let dir = match app.path().app_data_dir() {
        Ok(d) => d,
        Err(_) => return,
    };
    let _ = std::fs::create_dir_all(&dir);
    let ico = dir.join("dodo.ico");
    if !ico.exists() {
        let _ = std::fs::write(&ico, include_bytes!("../icons/icon.ico"));
    }
    let key = format!(r"HKCU\Software\Classes\AppUserModelId\{APP_ID}");
    let _ = std::process::Command::new("reg")
        .args(["add", &key, "/v", "DisplayName", "/d", "DoDo", "/f"])
        .creation_flags(CREATE_NO_WINDOW)
        .output();
    let _ = std::process::Command::new("reg")
        .args([
            "add",
            &key,
            "/v",
            "IconUri",
            "/d",
            &ico.to_string_lossy(),
            "/f",
        ])
        .creation_flags(CREATE_NO_WINDOW)
        .output();
}

#[tauri::command]
fn send_notification(title: String, body: String) -> Result<(), String> {
    notify_rust::Notification::new()
        .summary(&title)
        .body(&body)
        .app_id(APP_ID)
        .show()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// 默认数据目录:可执行文件同级 data\(数据跟随安装目录,便携式语义)。
/// 旧版数据在 %APPDATA%\com.dodo.todo,首次启动由前端搬迁。
#[tauri::command]
fn default_data_dir(_app: tauri::AppHandle) -> Result<String, String> {
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe
        .parent()
        .ok_or_else(|| "no parent dir".to_string())?
        .join("data");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

/// 旧版数据目录(%APPDATA%\com.dodo.todo),供首次搬迁判断
#[tauri::command]
fn legacy_data_dir() -> Result<String, String> {
    let dir = dirs_data_home().ok_or_else(|| "no data home".to_string())?;
    Ok(dir.to_string_lossy().to_string())
}

fn dirs_data_home() -> Option<std::path::PathBuf> {
    std::env::var("APPDATA").ok().map(|d| std::path::PathBuf::from(d).join("com.dodo.todo"))
}

/// 文件探测(旧数据搬迁判断用)
#[tauri::command]
fn fs_exists(path: String) -> Result<bool, String> {
    Ok(std::path::Path::new(&path).exists())
}

/// 单文件复制(同名覆盖)
#[tauri::command]
fn fs_copy(from: String, to: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&to).parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::copy(&from, &to).map(|_| ()).map_err(|e| e.to_string())
}

/// 目录递归复制(搬迁 backups 用)
#[tauri::command]
fn fs_copy_dir(from: String, to: String) -> Result<(), String> {
    fn rec(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
        std::fs::create_dir_all(dst)?;
        for e in std::fs::read_dir(src)? {
            let e = e?;
            let ty = e.file_type()?;
            let s = e.path();
            let d = dst.join(e.file_name());
            if ty.is_dir() { rec(&s, &d)?; } else { std::fs::copy(&s, &d)?; }
        }
        Ok(())
    }
    rec(std::path::Path::new(&from), std::path::Path::new(&to)).map_err(|e| e.to_string())
}

/// 同卷原子替换(rename 覆盖目标):恢复备份走「拷临时文件 → rename 落正」,中途失败不会把在用库截成半截
#[tauri::command]
fn fs_rename(from: String, to: String) -> Result<(), String> {
    std::fs::rename(&from, &to).map_err(|e| e.to_string())
}

#[tauri::command]
fn make_dir(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(&path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

/// 开机自启动:真实状态由系统管理,前端通过这三个命令读写
#[tauri::command]
fn autostart_status(app: tauri::AppHandle) -> Result<bool, String> {
    app.autolaunch().is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
fn autostart_enable(app: tauri::AppHandle) -> Result<(), String> {
    app.autolaunch().enable().map_err(|e| e.to_string())
}

#[tauri::command]
fn autostart_disable(app: tauri::AppHandle) -> Result<(), String> {
    app.autolaunch().disable().map_err(|e| e.to_string())
}

/// 显示/隐藏悬浮球窗口(设置→通用 开关)
#[tauri::command]
fn set_ball_visible(app: tauri::AppHandle, visible: bool) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("ball") {
        if visible {
            w.show().map_err(|e| e.to_string())?;
        } else {
            let _ = w.hide();
        }
    }
    Ok(())
}

/// 生效的备份文件夹:自定义 bdir 优先,否则数据目录 backups 子目录
fn backup_dir_of(base: &std::path::Path, bdir: &Option<String>) -> std::path::PathBuf {
    match bdir {
        Some(d) if !d.trim().is_empty() => std::path::PathBuf::from(d),
        _ => base.join("backups"),
    }
}

/// 是否为 DoDo 备份文件(dodo-*.db):清理与列表只认这一命名,防误删自选目录中的其他数据库
fn is_dodo_backup(p: &std::path::Path) -> bool {
    p.extension().is_some_and(|x| x == "db")
        && p.file_name().is_some_and(|n| n.to_string_lossy().starts_with("dodo-"))
}

/// 每日自动备份:复制 dodo.db 到备份文件夹(bdir 为空时用数据目录 backups 子目录),文件名带日期,按文件名倒序保留最近 keep 份。
/// force=true(手动「立即备份」)时同名也覆盖,保证拿到当下时刻的副本;自动备份保持当日仅首份。
#[tauri::command]
fn backup_database(
    dir: String,
    bdir: Option<String>,
    name: String,
    keep: u32,
    force: Option<bool>,
) -> Result<String, String> {
    // name 来自前端参数,拒绝路径分隔符与上跳,防止借备份写逃逸到任意路径
    if name.is_empty() || name.contains('\\') || name.contains('/') || name.contains("..") {
        return Err("invalid backup name".to_string());
    }
    let base = std::path::Path::new(&dir);
    let src = base.join("dodo.db");
    if !src.exists() {
        return Ok(String::new());
    }
    let bdir = backup_dir_of(base, &bdir);
    std::fs::create_dir_all(&bdir).map_err(|e| e.to_string())?;
    let dest = bdir.join(&name);
    if force.unwrap_or(false) || !dest.exists() {
        std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    }
    let mut files: Vec<std::path::PathBuf> = std::fs::read_dir(&bdir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok().map(|e| e.path()))
        // 只清理 DoDo 备份命名(dodo-*.db),防止用户自选目录中的其他 .db(含 dodo.db)被当旧备份删除
        .filter(|p| is_dodo_backup(p))
        .collect();
    files.sort();
    while files.len() > keep as usize {
        let _ = std::fs::remove_file(files.remove(0));
    }
    Ok(dest.to_string_lossy().to_string())
}

/// 备份列表:备份文件夹内 dodo-*.db 备份文件(名称/字节大小/修改时间秒),按名称倒序=最新在前
#[tauri::command]
fn list_backups(dir: String, bdir: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let base = std::path::Path::new(&dir);
    let bdir = backup_dir_of(base, &bdir);
    if !bdir.exists() {
        return Ok(vec![]);
    }
    let mut out: Vec<serde_json::Value> = std::fs::read_dir(&bdir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .filter(|e| is_dodo_backup(&e.path()))
        .filter_map(|e| {
            let meta = e.metadata().ok()?;
            let modified = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);
            Some(serde_json::json!({
                "name": e.file_name().to_string_lossy(),
                "size": meta.len(),
                "modified": modified,
            }))
        })
        .collect();
    out.sort_by(|a, b| b["name"].as_str().cmp(&a["name"].as_str()));
    Ok(out)
}

/// 批量写入:单连接事务执行一组语句。
/// 前端所有读写都走这里的显式 path(= 数据目录/dodo.db),保证读写同源。
#[derive(serde::Deserialize)]
struct Stmt {
    sql: String,
    #[serde(default)]
    values: Vec<serde_json::Value>,
}

fn bind_vals<'a>(
    mut q: sqlx::query::Query<'a, sqlx::Sqlite, sqlx::sqlite::SqliteArguments<'a>>,
    values: &'a [serde_json::Value],
) -> sqlx::query::Query<'a, sqlx::Sqlite, sqlx::sqlite::SqliteArguments<'a>> {
    for v in values {
        q = match v {
            serde_json::Value::Null => q.bind(None::<i64>),
            serde_json::Value::Bool(b) => q.bind(*b),
            serde_json::Value::Number(n) => match n.as_i64() {
                Some(i) => q.bind(i),
                None => q.bind(n.as_f64().unwrap_or_default()),
            },
            serde_json::Value::String(s) => q.bind(s.as_str()),
            // repeat 规则等以 JSON 对象直接传参,与插件行为一致存为 JSON 文本
            _ => q.bind(v.to_string()),
        };
    }
    q
}

async fn connect_db(path: &str, create: bool) -> Result<sqlx::SqlitePool, String> {
    let opts = sqlx::sqlite::SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(create);
    sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await
        .map_err(|e| e.to_string())
}

/// 打开数据库并确保表结构就绪(INIT_SQL + history/nextDue 补列,等价旧插件迁移 v1~v3)。
/// legacy = 旧默认库路径:目标库是全新的(meta 为空)而旧库有数据时,一次性自动搬迁,
/// 保证「自定义数据位置」切换后旧数据跟着走;已用过的目标库不会被覆盖。
#[tauri::command]
async fn sqlite_init(path: String, legacy: Option<String>) -> Result<(), String> {
    let pool = connect_db(&path, true).await?;
    let res = async {
        let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
        for s in INIT_SQL.split(';') {
            let s = s.trim();
            if !s.is_empty() {
                sqlx::query(s).execute(&mut *conn).await.map_err(|e| e.to_string())?;
            }
        }
        let cols: Vec<String> = sqlx::query("PRAGMA table_info(tasks)")
            .fetch_all(&mut *conn)
            .await
            .map_err(|e| e.to_string())?
            .iter()
            .filter_map(|r| r.try_get::<String, _>(1).ok())
            .collect();
        if !cols.contains(&"history".to_string()) {
            sqlx::query("ALTER TABLE tasks ADD COLUMN history TEXT DEFAULT '[]'")
                .execute(&mut *conn)
                .await
                .map_err(|e| e.to_string())?;
        }
        if !cols.contains(&"nextDue".to_string()) {
            sqlx::query("ALTER TABLE tasks ADD COLUMN nextDue TEXT")
                .execute(&mut *conn)
                .await
                .map_err(|e| e.to_string())?;
        }
        if let Some(lp) = legacy {
            if lp != path && std::path::Path::new(&lp).exists() {
                let meta_cnt: i64 =
                    sqlx::query("SELECT COUNT(*) FROM meta").fetch_one(&mut *conn).await.map_err(|e| e.to_string())?.try_get(0).map_err(|e| e.to_string())?;
                if meta_cnt == 0 {
                    let quoted = lp.replace('\'', "''");
                    let mig = async {
                        sqlx::query(&format!("ATTACH DATABASE '{quoted}' AS legacy_db"))
                            .execute(&mut *conn)
                            .await
                            .map_err(|e| e.to_string())?;
                        // 旧库缺补列时先补齐,保证下方显式列序搬迁不因结构差异静默失败
                        let lcols: Vec<String> = sqlx::query("PRAGMA legacy_db.table_info(tasks)")
                            .fetch_all(&mut *conn)
                            .await
                            .map_err(|e| e.to_string())?
                            .iter()
                            .filter_map(|r| r.try_get::<String, _>(1).ok())
                            .collect();
                        for (col, dflt) in [("history", " DEFAULT '[]'"), ("nextDue", "")] {
                            if !lcols.contains(&col.to_string()) {
                                sqlx::query(&format!(
                                    "ALTER TABLE legacy_db.tasks ADD COLUMN {col} TEXT{dflt}"
                                ))
                                .execute(&mut *conn)
                                .await
                                .map_err(|e| e.to_string())?;
                            }
                        }
                        // 显式列序搬迁,不依赖两库列序恰好一致(SELECT * 列序错位会静默写坏)
                        sqlx::query(
                            "INSERT OR REPLACE INTO tasks(id,title,note,list,tags,prio,due,time,remind,repeat,done,doneAt,subs,history,nextDue) \
                             SELECT id,title,note,list,tags,prio,due,time,remind,repeat,done,doneAt,subs,history,nextDue FROM legacy_db.tasks",
                        )
                        .execute(&mut *conn)
                        .await
                        .map_err(|e| e.to_string())?;
                        sqlx::query("INSERT OR REPLACE INTO lists(id,name,color,sort) SELECT id,name,color,sort FROM legacy_db.lists")
                            .execute(&mut *conn)
                            .await
                            .map_err(|e| e.to_string())?;
                        sqlx::query("INSERT OR REPLACE INTO meta(key,value) SELECT key,value FROM legacy_db.meta")
                            .execute(&mut *conn)
                            .await
                            .map_err(|e| e.to_string())?;
                        sqlx::query("DETACH DATABASE legacy_db")
                            .execute(&mut *conn)
                            .await
                            .map_err(|e| e.to_string())?;
                        Ok::<(), String>(())
                    }
                    .await;
                    if let Err(e) = mig {
                        // 旧库结构不符时跳过搬迁,目标库仍可用(空库)
                        eprintln!("[DoDo] 旧库搬迁跳过: {e}");
                    }
                }
            }
        }
        Ok(())
    }
    .await;
    pool.close().await;
    res
}

/// 查询:返回 JSON 对象数组(列名 → 值)
#[tauri::command]
async fn sqlite_select(
    path: String,
    sql: String,
    values: Vec<serde_json::Value>,
) -> Result<Vec<serde_json::Value>, String> {
    let pool = connect_db(&path, false).await?;
    let res = async {
        let rows = bind_vals(sqlx::query(&sql), &values)
            .fetch_all(&pool)
            .await
            .map_err(|e| e.to_string())?;
        let mut out = Vec::with_capacity(rows.len());
        for row in &rows {
            let mut m = serde_json::Map::new();
            for (i, col) in row.columns().iter().enumerate() {
                // SQLite 无严格类型,按 INTEGER → REAL → TEXT → BLOB 逐级尝试解码
                let v = match row.try_get::<Option<i64>, _>(i) {
                    Ok(Some(n)) => serde_json::Value::from(n),
                    Ok(None) => serde_json::Value::Null,
                    Err(_) => match row.try_get::<Option<f64>, _>(i) {
                        Ok(Some(f)) => serde_json::Value::from(f),
                        Ok(None) => serde_json::Value::Null,
                        Err(_) => match row.try_get::<Option<String>, _>(i) {
                            Ok(Some(s)) => serde_json::Value::from(s),
                            Ok(None) => serde_json::Value::Null,
                            Err(_) => match row.try_get::<Option<Vec<u8>>, _>(i) {
                                Ok(Some(b)) => {
                                    serde_json::Value::from(String::from_utf8_lossy(&b).to_string())
                                }
                                _ => serde_json::Value::Null,
                            },
                        },
                    },
                };
                m.insert(col.name().to_string(), v);
            }
            out.push(serde_json::Value::Object(m));
        }
        Ok(out)
    }
    .await;
    pool.close().await;
    res
}

/// 单条写语句(meta 标记等)
#[tauri::command]
async fn sqlite_exec(path: String, sql: String, values: Vec<serde_json::Value>) -> Result<(), String> {
    let pool = connect_db(&path, true).await?;
    let res = async {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        bind_vals(sqlx::query(&sql), &values)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        tx.commit().await.map_err(|e| e.to_string())
    }
    .await;
    pool.close().await;
    res
}

#[tauri::command]
async fn sqlite_batch(path: String, statements: Vec<Stmt>) -> Result<(), String> {
    let pool = connect_db(&path, false).await?;
    let res = async {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        for s in &statements {
            bind_vals(sqlx::query(&s.sql), &s.values)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }
        tx.commit().await.map_err(|e| e.to_string())
    }
    .await;
    pool.close().await;
    res.map(|_| ())
}

fn main() {
    tauri::Builder::default()
        // 注:旧版 tauri-plugin-sql 注册已移除——前端读写全部走本文件的 sqlite_* 自研命令,
        // 表结构权威路径 = sqlite_init(INIT_SQL + PRAGMA 补列),新增字段勿再走插件 Migration。
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // ---- 注册通知应用身份(显示名/图标归 DoDo,而非 PowerShell) ----
            register_aumid(app.handle());

            // ---- 系统托盘:常驻,左键唤起主界面 ----
            let show = MenuItem::with_id(app, "show", "显示主界面", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            tauri::tray::TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("DoDo 待办")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, ev| match ev.id.as_ref() {
                    "show" => show_main(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, ev| {
                    // 仅左键唤起主界面;右键保留给菜单,避免抢焦点导致菜单无法使用
                    if let TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = ev
                    {
                        show_main(tray.app_handle());
                    }
                })
                .build(app)?;

            // ---- 全局快捷键:Ctrl+Shift+Space 呼出并聚焦快速添加 ----
            // 注册失败(如已有另一 DoDo 实例在运行占用)不阻断启动,仅记日志
            let sc: Shortcut = "Ctrl+Shift+Space".parse().expect("invalid shortcut");
            app.handle().plugin(
                tauri_plugin_global_shortcut::Builder::new()
                    .with_handler(move |app, shortcut, event| {
                        if event.state() == ShortcutState::Pressed && shortcut == &sc {
                            show_main(app);
                            if let Some(win) = app.get_webview_window("main") {
                                let _ = win.emit("quick-add-focus", ());
                            }
                        }
                    })
                    .build(),
            )?;
            if let Err(e) = app.global_shortcut().register(sc) {
                eprintln!("[DoDo] 全局快捷键注册失败(可能已有 DoDo 实例在运行): {e}");
            }

            // ---- 悬浮速记球:置顶透明小窗,内容/位置/展开由前端 ball.js 管理 ----
            tauri::WebviewWindowBuilder::new(
                app,
                "ball",
                tauri::WebviewUrl::App("ball.html".into()),
            )
            .title("DoDo 速记球")
            .inner_size(62.0, 62.0)
            .decorations(false)
            .transparent(true)
            .always_on_top(true)
            .skip_taskbar(true)
            .resizable(false)
            .shadow(false)
            .focused(false)
            .visible(false) // 前端定位完成后经 ball-ready 触发显示
            .build()?;

            // 球右键「打开主窗口」→ 唤起主界面
            let handle = app.handle().clone();
            app.listen("ball-open-main", move |_| show_main(&handle));
            // 球右键「设置」→ 唤起主界面并打开设置页
            let handle2 = app.handle().clone();
            app.listen("ball-open-settings", move |_| {
                show_main(&handle2);
                let _ = handle2.emit_to("main", "open-settings", ());
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            send_notification,
            default_data_dir,
            legacy_data_dir,
            fs_exists,
            fs_copy,
            fs_copy_dir,
            fs_rename,
            make_dir,
            open_folder,
            autostart_status,
            autostart_enable,
            autostart_disable,
            backup_database,
            list_backups,
            set_ball_visible,
            sqlite_init,
            sqlite_select,
            sqlite_exec,
            sqlite_batch
        ])
        .on_window_event(|window, event| {
            // 点击关闭 → 最小化到托盘,由托盘菜单「退出」真正退出
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running DoDo");
}
