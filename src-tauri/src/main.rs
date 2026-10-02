// 阻止 Windows release 构建弹出控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconEvent,
    Emitter, Listener, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_sql::{Migration, MigrationKind};

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

#[tauri::command]
fn default_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    app.path()
        .app_config_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
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

/// 每日自动备份:复制 dodo.db 到备份文件夹(bdir 为空时用数据目录 backups 子目录),文件名带日期,按文件名倒序保留最近 keep 份
#[tauri::command]
fn backup_database(dir: String, bdir: Option<String>, name: String, keep: u32) -> Result<String, String> {
    let base = std::path::Path::new(&dir);
    let src = base.join("dodo.db");
    if !src.exists() {
        return Ok(String::new());
    }
    let bdir = match bdir {
        Some(d) if !d.trim().is_empty() => std::path::PathBuf::from(d),
        _ => base.join("backups"),
    };
    std::fs::create_dir_all(&bdir).map_err(|e| e.to_string())?;
    let dest = bdir.join(&name);
    if !dest.exists() {
        std::fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    }
    let mut files: Vec<std::path::PathBuf> = std::fs::read_dir(&bdir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|x| x == "db"))
        .collect();
    files.sort();
    while files.len() > keep as usize {
        let _ = std::fs::remove_file(files.remove(0));
    }
    Ok(dest.to_string_lossy().to_string())
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
                        for t in ["tasks", "lists", "meta"] {
                            sqlx::query(&format!(
                                "INSERT OR REPLACE INTO {t} SELECT * FROM legacy_db.{t}"
                            ))
                            .execute(&mut *conn)
                            .await
                            .map_err(|e| e.to_string())?;
                        }
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
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:dodo.db",
                    vec![
                        Migration {
                            version: 1,
                            description: "init",
                            sql: INIT_SQL,
                            kind: MigrationKind::Up,
                        },
                        Migration {
                            version: 2,
                            description: "add task history",
                            sql: "ALTER TABLE tasks ADD COLUMN history TEXT DEFAULT '[]';",
                            kind: MigrationKind::Up,
                        },
                        Migration {
                            version: 3,
                            description: "add task nextDue",
                            sql: "ALTER TABLE tasks ADD COLUMN nextDue TEXT;",
                            kind: MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
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
            app.global_shortcut().register(sc)?;

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
            make_dir,
            open_folder,
            autostart_status,
            autostart_enable,
            autostart_disable,
            backup_database,
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
