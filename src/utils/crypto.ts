import CryptoJS from "crypto-js";

let sessionKeyCache: string | null = null;

export function getSessionKey(): string | null {
  if (sessionKeyCache) return sessionKeyCache;
  sessionKeyCache = sessionStorage.getItem("sd");
  return sessionKeyCache;
}

export function setSessionKey(key: string) {
  sessionKeyCache = key;
  sessionStorage.setItem("sd", key);
}

function getKeyIv() {
  const keyStr = getSessionKey();
  if (!keyStr || keyStr.length < 16) {
    throw new Error("缺少会话密钥(sd)或长度不足");
  }
  const k = keyStr.substring(0, 16);
  return {
    key: CryptoJS.enc.Utf8.parse(k),
    iv: CryptoJS.enc.Utf8.parse(k)
  };
}

export function encryptData(plain: string): string {
  const { key, iv } = getKeyIv();
  const encrypted = CryptoJS.AES.encrypt(plain, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString(); // base64
}

export function decryptData(base64Cipher: string): string {
  const { key, iv } = getKeyIv();
  const decrypted = CryptoJS.AES.decrypt(base64Cipher, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
}

export function encryptJson(jsonObj: unknown): { data: string } {
  const jsonStr = typeof jsonObj === "string" ? jsonObj : JSON.stringify(jsonObj ?? {});
  return { data: encryptData(jsonStr) };
}

const cryptoUtil = {
  getSessionKey,
  setSessionKey,
  encryptData,
  decryptData,
  encryptJson
};

export default cryptoUtil;