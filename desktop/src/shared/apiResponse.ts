export type ApiResponse<TData> = {
  code: number;
  message: string;
  data: TData;
};
