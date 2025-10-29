import { http } from "@/utils/http";

/** 批次统计列表 */
export const getBatchStatisticsList = (params: {
  pageSize: number;
  pageNum: number;
  startTime: string;
  endTime: string;
}) => {
  return http.request<any>("post", "/statistics/listByBatch", { data: params });
};

/** 批次详情 */
export const getBatchResult = (id: string | number) => {
  return http.request<any>("post", "/statistics/getResultByBatch2", { data: { id } });
};