use std::path::PathBuf;

pub fn app_data_dir() -> Result<PathBuf, String> {
    std::env::var_os("APPDATA")
        .map(PathBuf::from)
        .map(|path| path.join("vina"))
        .ok_or_else(|| "APPDATA is not available.".to_string())
}
