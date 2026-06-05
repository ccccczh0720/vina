use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

pub fn init(app: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app.get_webview_window("floating") {
        let _ = window.set_shadow(false);
    }

    Ok(())
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub x: Option<i32>,
    pub y: Option<i32>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub always_on_top: Option<bool>,
    pub visible: Option<bool>,
}

#[tauri::command]
pub fn open_liuyao_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("liuyao")
        .ok_or_else(|| "liuyao window not found.".to_string())?;

    window.show().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn hide_liuyao_window(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("liuyao")
        .ok_or_else(|| "liuyao window not found.".to_string())?;

    window.hide().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn save_window_state(label: String, state: WindowState) -> Result<(), String> {
    let _ = (label, state);
    Ok(())
}

#[tauri::command]
pub fn load_window_state(label: String) -> Result<Option<WindowState>, String> {
    let _ = label;
    Ok(None)
}
