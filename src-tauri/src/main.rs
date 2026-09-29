// 阻止 Windows release 构建弹出控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconEvent,
    Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_sql::{Migration, MigrationKind};

use std::os::windows::process::CommandExt;

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

/// 每日自动备份:复制 dodo.db 到 backups 子目录(文件名带日期),按文件名倒序保留最近 keep 份
#[tauri::command]
fn backup_database(dir: String, name: String, keep: u32) -> Result<String, String> {
    let base = std::path::Path::new(&dir);
    let src = base.join("dodo.db");
    if !src.exists() {
        return Ok(String::new());
    }
    let bdir = base.join("backups");
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
/// tauri-plugin-sql 的池是多连接,前端分开调 BEGIN/COMMIT 不可靠,事务必须在 Rust 侧包。
#[derive(serde::Deserialize)]
struct Stmt {
    sql: String,
    #[serde(default)]
    values: Vec<serde_json::Value>,
}

#[tauri::command]
async fn sqlite_batch(path: String, statements: Vec<Stmt>) -> Result<(), String> {
    let opts = sqlx::sqlite::SqliteConnectOptions::new()
        .filename(&path)
        .create_if_missing(false);
    let pool = sqlx::sqlite::SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(opts)
        .await
        .map_err(|e| e.to_string())?;
    let res = async {
        let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
        for s in &statements {
            let mut q = sqlx::query(&s.sql);
            for v in &s.values {
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
            q.execute(&mut *tx).await.map_err(|e| e.to_string())?;
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
