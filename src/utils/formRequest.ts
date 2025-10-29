/**
 * 将对象转换为 Form Data 格式的字符串
 */
export function objectToFormData(obj: Record<string, any>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
}

/**
 * 发送加密的 Form Data 请求
 */
export async function sendFormRequest(url: string, data: Record<string, any>) {
  const sv = sessionStorage.getItem('sv') || '';
  const sd = sessionStorage.getItem('sd') || '';
  
  let requestBody: string;
  let headers: Record<string, string> = {
    'X-Auth-Token': sv
  };
  
  // 根据你的项目加密方式，这里有几种可能：
  
  // 方案1：如果你的项目使用 CryptoJS（检查 window.CryptoJS）
  if (sd && sd.length >= 16 && (window as any).CryptoJS) {
    try {
      const CryptoJS = (window as any).CryptoJS;
      const jsonStr = JSON.stringify(data);
      
      // 使用 AES 加密
      const encrypted = CryptoJS.AES.encrypt(jsonStr, CryptoJS.enc.Utf8.parse(sd), {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }).toString();
      
      const formParams = new URLSearchParams();
      formParams.append('data', encrypted);
      requestBody = formParams.toString();
    } catch (e) {
      console.error('Encryption failed, sending plain data:', e);
      requestBody = objectToFormData(data);
    }
  } else {
    // 无加密，直接发送 Form Data
    requestBody = objectToFormData(data);
  }
  
  headers['Content-Type'] = 'application/x-www-form-urlencoded';
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: requestBody
  });
  
  const responseText = await response.text();
  
  // 尝试解析响应
  try {
    const responseJson = JSON.parse(responseText);
    
    // 如果响应中有 data 字段且是加密的字符串，尝试解密
    if (responseJson.data && typeof responseJson.data === 'string' && sd && (window as any).CryptoJS) {
      try {
        const CryptoJS = (window as any).CryptoJS;
        const decrypted = CryptoJS.AES.decrypt(responseJson.data, CryptoJS.enc.Utf8.parse(sd), {
          mode: CryptoJS.mode.ECB,
          padding: CryptoJS.pad.Pkcs7
        });
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        responseJson.data = JSON.parse(decryptedStr);
      } catch (e) {
        // data 可能不是加密的，保持原样
        console.log('Response data is not encrypted or decryption failed');
      }
    }
    
    return responseJson;
  } catch (e) {
    // 响应不是 JSON
    return { data: responseText };
  }
}

/**
 * 简化版：不加密的 Form Data 请求
 */
export async function sendPlainFormRequest(url: string, data: Record<string, any>) {
  const sv = sessionStorage.getItem('sv') || '';
  
  const requestBody = objectToFormData(data);
  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Auth-Token': sv
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: requestBody
  });
  
  const responseText = await response.text();
  
  try {
    return JSON.parse(responseText);
  } catch (e) {
    return { data: responseText };
  }
}