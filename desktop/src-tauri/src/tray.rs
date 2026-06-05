use tauri::{AppHandle, Manager};

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    let _ = app.app_handle();
    Ok(())
}
