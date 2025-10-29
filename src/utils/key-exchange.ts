/* ESM 版密钥交换：不依赖全局 window.JSEncrypt，直接 import 使用 */
import JSEncrypt from "jsencrypt";

declare global {
  interface Window {
    keyExchangePromise?: Promise<string>;
  }
}

/**
 * 发起密钥交换：
 * 1) 生成临时 RSA 密钥对
 * 2) POST /api/s 发送 publicKey
 * 3) 服务端用该公钥加密 sd 返回 { sv, data }
 * 4) 前端用私钥解密 data 得到真正的 sd
 * 5) 将 sv/sd 写入 sessionStorage，并 resolve(sd)
 */
export const keyExchangePromise: Promise<string> = (async () => {
  // 生成密钥（与后端保持一致的 key_size，1024/2048 都可）
  const rsa = new JSEncrypt({ default_key_size: 1024 });
  rsa.getKey(); // 同步生成

  const publicKey = rsa.getPublicKey(); // PEM 字符串

  // 发起握手
  const resp = await fetch("/api/s", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey })
  });
  if (!resp.ok) {
    throw new Error(`Key-exchange http ${resp.status}`);
  }
  const res = await resp.json();
  // 期望后端返回 { sv: "...", data: "<RSA base64>" }
  if (!res || !res.sv || !res.data) {
    throw new Error("Key-exchange response missing sv/data");
  }

  // 用私钥解密得到真正 sd
  const sd: string | false = rsa.decrypt(res.data);
  if (!sd || sd.length < 16) {
    throw new Error("Failed to decrypt session key (sd)");
  }

  // 持久化，供拦截器读取
  sessionStorage.setItem("sv", res.sv);
  sessionStorage.setItem("sd", sd);

  // 兼容旧用法
  window.keyExchangePromise = Promise.resolve(sd);

  console.log("密钥交换成功 sv=", res.sv, " sd.len=", sd.length);
  return sd;
})();

// 同时挂到 window，保证旧代码通过 window.keyExchangePromise 也能拿到
window.keyExchangePromise = keyExchangePromise;