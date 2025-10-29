import { http } from "@/utils/http";

/** 获取账单列表 */
export const getBillList = (params: {
  pageSize: number;
  pageNum: number;
  startTime: string;
  endTime: string;
}) => {
  return http.request<any>("post", "/user/daylibill", { data: params });
};