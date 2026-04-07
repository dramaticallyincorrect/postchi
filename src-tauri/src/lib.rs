use tauri::Manager;

mod project_files;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let client = sentry::init((
        "https://eeb2055eabeb182e16c97d41ac9cad4a@o4511105523449856.ingest.de.sentry.io/4511105526202448",
        sentry::ClientOptions {
            release: sentry::release_name!(),
            auto_session_tracking: true,
            send_default_pii: false,
            ..Default::default()
        },
    ));

    // Caution! Everything before here runs in both app and crash reporter processes
    #[cfg(not(target_os = "ios"))]
    let _guard = tauri_plugin_sentry::minidump::init(&client);
    // Everything after here runs in only the app process
    tauri::Builder::default()
        .plugin(tauri_plugin_sentry::init(&client))
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = &window; // suppress unused warning on platforms that don't need decorations

            #[cfg(target_os = "windows")]
            window.set_decorations(false)?;

            #[cfg(target_os = "linux")]
            window.set_decorations(false)?;

            Ok(())
        })
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .build(),
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![greet, project_files::read_project_file_tree])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
