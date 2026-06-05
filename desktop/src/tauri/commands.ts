import { invoke } from "@tauri-apps/api/core";
import type { AiPolishInput, AiPolishOutput, AppSettings, WindowState } from "../shared/types";

export function openLiuyaoWindow(): Promise<void> {
  return invoke("open_liuyao_window");
}

export function hideLiuyaoWindow(): Promise<void> {
  return invoke("hide_liuyao_window");
}

export function exitApp(): Promise<void> {
  return invoke("exit_app");
}

export function saveWindowState(label: string, state: WindowState): Promise<void> {
  return invoke("save_window_state", { label, state });
}

export function loadWindowState(label: string): Promise<WindowState | null> {
  return invoke("load_window_state", { label });
}

export function loadAppSettings(): Promise<AppSettings> {
  return invoke("load_app_settings");
}

export function saveAppSettings(settings: AppSettings): Promise<void> {
  return invoke("save_app_settings", { settings });
}

export function polishInterpretation(input: AiPolishInput): Promise<AiPolishOutput> {
  return invoke("polish_interpretation", { input });
}
