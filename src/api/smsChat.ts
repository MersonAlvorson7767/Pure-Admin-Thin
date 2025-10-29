import { http } from "@/utils/http";

/** 聊天列表（分页 + 条件） */
export const apiGetChatList = (params: {
  phoneId?: string | number;        // 我的号码筛选（-1 或空表示全部）
  pageNum: number;
  pageSize: number;
  searchPhone?: string;             // 对方号码搜索
  selectTypes?: string | number;    // 5=有回复，2=无回复（与老版一致）
}) => {
  return http.request<any>("post", "/userchatWithPage/listAllWithPhone", { data: params });
};

/** 会话消息列表 */
export const apiGetMessages = (chatId: number | string) => {
  return http.request<any>("post", "/userchat/listMessage", { data: { chatId } });
};

/** 发送文字消息 */
export const apiSendText = (params: { chatId: number | string; message: string }) => {
  return http.request<any>("post", "/userchatDayliModel/sendMessage", { data: params });
};

/** 发送图片消息（base64 + 文件类型） */
export const apiSendImage = (params: {
  chatId: number | string;
  imageBase64: string;
  fileType: "png" | "jpg" | "jpeg" | string;
}) => {
  return http.request<any>("post", "/userchatDayliModel/sendImageMessage", { data: params });
};

/** 置顶 / 取消置顶 */
export const apiSetSortIndex = (params: { chatId: number | string; enable: boolean }) => {
  return http.request<any>("post", "/userchatWithPage/setSortIndex", { data: params });
};

/** 删除会话 */
export const apiDeleteChat = (chatId: number | string) => {
  return http.request<any>("post", "/userchat/delchat", { data: { chatId } });
};

/** 修改备注 */
export const apiUpdateName = (params: { chatId: number | string; name: string }) => {
  return http.request<any>("post", "/userchatWithPage/updateName", { data: params });
};

/** 新建会话窗口（按老版字段） */
export const apiAddChat = (params: {
  phoneId: string | number;         // 我方号码ID
  addressBookName?: string;         // 备注名
  phone: string;                    // 对方号码（含区号）
}) => {
  return http.request<any>("post", "/userchatWithPage/add", { data: params });
};

/** 批量短信（进入队列） */
export const apiBatchSendText = (params: {
  batchPhone: string;               // 换行分隔号码
  batchContent: string;             // 短信内容
  enableSplit: boolean;             // 超字数按多条
  existsUsingOldCard?: boolean;     // 可选，是否复用旧手机号
  templateId?: string | number;     // 话术模板ID
}) => {
  return http.request<any>("post", "/userchat/batchPhoneSendDayMessageWithQueue", { data: params });
};

/** 批量发送彩信 */
export const apiBatchSendImage = (params: {
  phoneId: string | number;
  batchPhone: string;               // 换行分隔号码
  imageBase64: string;
  fileType: "png" | "jpg" | "jpeg" | string;
}) => {
  return http.request<any>("post", "/userchat/batchSendImageMessage", { data: params });
};

/** 模板列表 */
export const apiListTemplates = () => {
  return http.request<any>("post", "/tmp/list", { data: {} });
};

/** 模板详情 */
export const apiTemplateDetail = (id: number | string) => {
  return http.request<any>("post", "/tmp/getDetailByUser", { data: { id } });
};

/** 合并状态（未读/会话/消息状态批量查询） */
export const apiMergeStatus = (params: {
  listMessageStatusAllId?: string;  // 逗号分隔消息ID
  listAllStatusAllId?: string;      // 逗号分隔会话ID
  unReadMessageChatId?: string | number;
  unReadMessageLastId?: string | number;
}) => {
  return http.request<any>("post", "/userChatStatus/mergeStatus", { data: params });
};