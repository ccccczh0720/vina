use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub always_on_top: bool,
    pub show_floating_widget: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            always_on_top: true,
            show_floating_widget: true,
        }
    }
}

#[tauri::command]
pub fn load_app_settings() -> Result<AppSettings, String> {
    Ok(AppSettings::default())
}

#[tauri::command]
pub fn save_app_settings(settings: AppSettings) -> Result<(), String> {
    let _ = settings;
    Ok(())
}
