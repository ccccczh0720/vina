#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
mod settings;
mod storage;
mod tray;
mod window;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            window::init(app.handle())?;
            tray::init(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ai::polish_interpretation,
            settings::load_app_settings,
            settings::save_app_settings,
            window::hide_liuyao_window,
            window::load_window_state,
            window::open_liuyao_window,
            window::save_window_state
        ])
        .run(tauri::generate_context!())
        .expect("error while running Vina desktop widget");
}
