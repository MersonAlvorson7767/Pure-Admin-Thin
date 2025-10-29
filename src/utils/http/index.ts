import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import NProgress from "../progress";
import { getToken } from "@/utils/auth";
import cryptoUtil from "@/utils/crypto";

const defaultConfig: AxiosRequestConfig = {
  timeout: 10000,
  withCredentials: true,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  },
  baseURL: import.meta.env.VITE_API_BASE
};

// 需要以“字符串 JSON + x-www-form-urlencoded”提交的 URL 列表（可按需扩展）
const STRING_BODY_URLS: RegExp[] = [
  /\/user\/login(?:\?|$)/,
  /\/statistics\/listByBatch(?:\?|$)/,
  /\/statistics\/getResultByBatch2(?:\?|$)/,
  /\/user\/daylibill(?:\?|$)/,

  // 新增：短信聊天相关，沿用老版本 Form Data 风格（字符串体）
  /\/userchatWithPage\/listAllWithPhone(?:\?|$)/,
  /\/userchat\/listMessage(?:\?|$)/,
  /\/userchatDayliModel\/sendMessage(?:\?|$)/,
  /\/userchatDayliModel\/sendImageMessage(?:\?|$)/,
  /\/userchat\/batchPhoneSendDayMessageWithQueue(?:\?|$)/,
  /\/userchat\/batchSendImageMessage(?:\?|$)/,
  /\/userchatWithPage\/setSortIndex(?:\?|$)/,
  /\/userchat\/delchat(?:\?|$)/,
  /\/userchatWithPage\/updateName(?:\?|$)/,
  /\/userchatWithPage\/add(?:\?|$)/,
  /\/tmp\/list(?:\?|$)/,
  /\/tmp\/getDetailByUser(?:\?|$)/,
  /\/userChatStatus\/mergeStatus(?:\?|$)/
];

function isStringBodyUrl(url?: string) {
  if (!url) return false;
  return STRING_BODY_URLS.some(re => re.test(url));
}
function isLoginUrl(url?: string) {
  return !!url && /\/user\/login(\?|$)/.test(url);
}

// 大小写无关覆盖/删除请求头
function setHeaderCI(headers: Record<string, any>, name: string, value: string) {
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers || {})) {
    if (k.toLowerCase() === lower) delete (headers as any)[k];
  }
  (headers as any)[name] = value;
}
function deleteHeaderCI(headers: Record<string, any>, name: string) {
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers || {})) {
    if (k.toLowerCase() === lower) delete (headers as any)[k];
  }
}

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  private static requests: Array<(token: string) => void> = [];
  private static isRefreshing = false;
  private static initConfig: PureHttpRequestConfig = {};
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        setHeaderCI(config.headers!, "token", token);
        resolve(config);
      });
    });
  }

  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        if (config.url?.startsWith("/get-async-routes")) config.baseURL = "";
        NProgress.start();

        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
        }

        const urlStr = (config.url || "").toString();
        const method = (config.method || "get").toLowerCase();
        const bodyMethods = ["post", "put", "patch", "delete"];
        const isFormData =
          typeof FormData !== "undefined" && config.data instanceof FormData;

        // 统一带上交换令牌与业务 token
        config.headers = config.headers || {};
        const sv = sessionStorage.getItem("sv");
        if (sv) setHeaderCI(config.headers, "X-Auth-Token", sv);

        // 登录接口显式移除 token，其它接口照常带
        if (isLoginUrl(urlStr)) {
          deleteHeaderCI(config.headers, "token");
        } else {
          const tk = getToken()?.accessToken;
          if (tk) setHeaderCI(config.headers, "token", tk);
        }

        // 加密与体型式处理
        if (bodyMethods.includes(method) && !isFormData) {
          const sd = cryptoUtil.getSessionKey();
          if (!sd) return Promise.reject(new Error("缺少会话密钥(sd)，请先完成密钥交换"));

          // 原始 body
          let originalBody: any = config.data ?? {};
          if (typeof originalBody === "string") {
            try { originalBody = JSON.parse(originalBody); } catch {}
          }

          // 登录字段自适配：username -> account
          if (isLoginUrl(urlStr) && originalBody && typeof originalBody === "object") {
            if (originalBody.username && !originalBody.account) {
              originalBody = { account: originalBody.username, password: originalBody.password };
            } else if (originalBody.data && typeof originalBody.data === "object") {
              const d = originalBody.data;
              if (d.username && !d.account) {
                originalBody = { account: d.username, password: d.password };
              } else if (d.account && d.password) {
                originalBody = d;
              }
            }
          }

          // 生成 { data: "<base64>" }
          const encryptedPayload = cryptoUtil.encryptJson(originalBody);

          if (isStringBodyUrl(urlStr)) {
            // 特定 URL：按“整段字符串 JSON + x-www-form-urlencoded”
            const jsonString = JSON.stringify(encryptedPayload);
            config.data = jsonString;

            setHeaderCI(config.headers, "Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            config.transformRequest = [(d) => d];

            // DEBUG
            try {
              const ct = Object.entries(config.headers || {}).find(([k]) => k.toLowerCase() === "content-type")?.[1];
              console.log(
                "[STRING BODY DEBUG]", urlStr,
                "| CT:", ct,
                "| typeof data:", typeof config.data,
                "| data head:", typeof config.data === "string"
                  ? (config.data as string).slice(0, 120)
                  : JSON.stringify(config.data).slice(0, 120)
              );
            } catch {}
          } else {
            // 其他接口：标准 JSON 对象提交
            config.data = encryptedPayload; // { data: "<base64>" }
            setHeaderCI(config.headers, "Content-Type", "application/json; charset=UTF-8");
          }
        }

        return config;
      },
      error => Promise.reject(error)
    );
  }

  // 同时兼容字符串/对象返回体，自动解密
  private tryParseAndMaybeDecrypt(raw: any): any {
    try {
      let payload = raw;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch { return payload; }
      }
      if (payload && typeof payload === "object" && typeof payload.data === "string") {
        const sd = cryptoUtil.getSessionKey();
        if (!sd) return payload;
        const decryptedStr = cryptoUtil.decryptData(payload.data);
        try { return JSON.parse(decryptedStr); } catch { return decryptedStr; }
      }
      return payload;
    } catch { return raw; }
  }

  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        NProgress.done();
        const $config = response.config;
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
        }
        return this.tryParseAndMaybeDecrypt(response?.data);
      },
      (error: PureHttpError) => {
        NProgress.done();
        try {
          if (error?.response) {
            const raw = error.response.data ?? (error.request as any)?.responseText;
            const decrypted = this.tryParseAndMaybeDecrypt(raw);
            if (decrypted !== undefined) (error.response as any).data = decrypted;
            console.log("[ERROR DECRYPTED]", decrypted);
          }
        } catch {}
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        return Promise.reject($error);
      }
    );
  }

  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = { method, url, ...param, ...axiosConfig } as PureHttpRequestConfig;
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance.request(config).then((response: undefined) => resolve(response)).catch(reject);
    });
  }

  public post<T, P>(url: string, params?: AxiosRequestConfig<P>, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("post", url, params as any, config);
  }

  public get<T, P>(url: string, params?: AxiosRequestConfig<P>, config?: PureHttpRequestConfig): Promise<T> {
    return this.request<T>("get", url, params as any, config);
  }
}

export const http = new PureHttp();