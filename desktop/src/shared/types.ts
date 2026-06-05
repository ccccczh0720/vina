export type WindowState = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  alwaysOnTop?: boolean;
  visible?: boolean;
};

export type AppSettings = {
  alwaysOnTop: boolean;
  showFloatingWidget: boolean;
};

export type AiPolishInput = {
  sourceText: string;
};

export type AiPolishOutput = {
  polishedText: string | null;
  status: "success" | "failed" | "disabled";
};
