/**
 * 加密解密工具类
 * 使用AES加密算法对API请求数据进行加密传输
 */

// 加密配置
const CryptoConfig = {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
};

/**
 * 加密数据
 * @param {string} data - 要加密的数据
 * @param {string} sessionKey - 会话密钥
 * @returns {string} 加密后的base64字符串
 */
function encryptData(data, sessionKey) {
    if (!sessionKey) {
        console.error('加密失败：会话密钥不存在。');
        return data;
    }
    try {
        const key = CryptoJS.enc.Utf8.parse(sessionKey.substring(0, 16));
        const iv = CryptoJS.enc.Utf8.parse(sessionKey.substring(0, 16));
        
        const encrypted = CryptoJS.AES.encrypt(data, key, {
            iv: iv,
            mode: CryptoConfig.mode,
            padding: CryptoConfig.padding
        });
        
        return encrypted.toString();
    } catch (error) {
        console.error('数据加密失败:', error);
        return data; // 加密失败时返回原始数据
    }
}

/**
 * 解密数据
 * @param {string} encryptedData - 要解密的base64字符串
 * @param {string} sessionKey - 会话密钥
 * @returns {string} 解密后的原始数据
 */
function decryptData(encryptedData, sessionKey) {
    if (!sessionKey) {
        console.error('解密失败：会话密钥不存在。');
        return encryptedData;
    }
    try {
        const key = CryptoJS.enc.Utf8.parse(sessionKey.substring(0, 16));
        const iv = CryptoJS.enc.Utf8.parse(sessionKey.substring(0, 16));
        
        const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
            iv: iv,
            mode: CryptoConfig.mode,
            padding: CryptoConfig.padding
        });
        
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('数据解密失败:', error);
        return encryptedData; // 解密失败时返回加密数据
    }
}

/**
 * 加密JSON对象
 * @param {object} jsonObj - 要加密的JSON对象
 * @param {string} sessionKey - 会话密钥
 * @returns {object} 包含加密数据的对象
 */
function encryptJson(jsonObj, sessionKey) {
    try {
        const jsonStr = typeof jsonObj === 'string' ? jsonObj : JSON.stringify(jsonObj);
        const encrypted = encryptData(jsonStr, sessionKey);
        return {
            // encrypted: true,
            data: encrypted
        };
    } catch (error) {
        console.error('JSON加密失败:', error);
        return jsonObj; // 加密失败时返回原始对象
    }
}

// 全局AJAX加解密处理器
if (window.jQuery) {
    // Global AJAX prefilter to encrypt request data
    $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
        // Skip encryption for the key exchange endpoint
        if (options.url.includes('/api/key-exchange')) {
            return;
        }
    
        // // Ensure credentials (like cookies) are sent with the request
        // options.xhrFields = {
        //     withCredentials: true
        // };
    
        const sessionKey = sessionStorage.getItem("sd");
        const token = sessionStorage.getItem("sv");

        if (token) {
            jqXHR.setRequestHeader('X-Auth-Token', token);
        }

        if (!sessionKey) {
            return;
        }

        // 如果没有会话密钥，或者请求是密钥交换，则不加密
        if (!sessionKey || options.url.includes("/api/key-exchange")) {
            return;
        }

        // --- 1. 请求加密 ---
        if (options.data && needEncrypt(options.data)) {
            if (!options.type || options.type.toUpperCase() !== 'GET') {
                try {
                    let dataObj = originalOptions.data;
                    if (typeof dataObj === 'string') {
                        try {
                            dataObj = JSON.parse(dataObj);
                        } catch (e) {
                            // Ignore if not a JSON string
                        }
                    }
                    
                    const encryptedData = encryptJson(dataObj, sessionKey);
                    options.data = JSON.stringify(encryptedData);
                    // The content type is already set to application/json by default for most POST requests

                } catch (error) {
                    console.error('请求数据加密失败:', error);
                }
            }
        }

        // --- 2. 响应解密 ---
        const originalDataFilter = options.dataFilter;
        options.dataFilter = function(data, type) {
            let processedData = data;
            if (originalDataFilter) {
                processedData = originalDataFilter.call(this, data, type);
            }

            if (!processedData) {
                return processedData;
            }
            try {
                // The response is expected to be a JSON string like {"data":"..."}
                const responseJson = JSON.parse(processedData);
                if (responseJson && responseJson.data) {
                    const decryptedData = decryptData(responseJson.data, sessionKey);
                    return decryptedData; // Return the decrypted JSON string
                }
                return processedData; // Return original if not in expected format
            } catch (e) {
                // If parsing fails, it might not be our encrypted format, return as is.
                return processedData;
            }
        };
    });
}

/**
 * 解密JSON对象
 * @param {object} encryptedObj - 包含加密数据的对象
 * @returns {object} 解密后的JSON对象
 */
function decryptJson(encryptedObj) {
    try {
        if (encryptedObj && encryptedObj.encrypted && encryptedObj.data) {
            const decryptedStr = decryptData(encryptedObj.data);
            return JSON.parse(decryptedStr);
        }
        return encryptedObj; // 如果不是加密格式，返回原始对象
    } catch (error) {
        console.error('JSON解密失败:', error);
        return encryptedObj; // 解密失败时返回加密对象
    }
}

/**
 * 检查数据是否需要加密
 * @param {object} data - 要检查的数据
 * @returns {boolean} 是否需要加密
 */
function needEncrypt(data) {
    // 不加密空数据、文件上传、特定路径
    if (!data || data instanceof FormData) {
        return false;
    }
    
    // 可以在这里添加其他不需要加密的条件
    return true;
}

/**
 * 检查响应数据是否需要解密
 * @param {object} response - 响应数据
 * @returns {boolean} 是否需要解密
 */
function needDecrypt(response) {
    // 此函数现在由全局AJAX过滤器处理，但保留以防其他地方使用
    return response && response.encrypted === true && response.data;
}

// 导出函数供全局使用
window.CryptoHelper = {
    encryptData,
    decryptData,
    encryptJson,
    decryptJson,
    needEncrypt,
    needDecrypt
};

// // 全局AJAX加解密处理器
// if (window.jQuery) {
//     $.ajaxPrefilter(function(options, originalOptions, jqXHR) {
        
//         // --- 1. 请求加密 ---
//         // 逻辑从 footer.html 的 beforeSend 迁移而来
//         if (options.data && CryptoHelper.needEncrypt(options.data)) {
//             // 排除GET请求
//             if (!options.type || options.type.toUpperCase() !== 'GET') {
//                 try {
//                     let dataObj = originalOptions.data; // 使用原始数据

//                     // 如果数据是字符串，尝试解析为JSON对象
//                     if (typeof dataObj === 'string') {
//                         try {
//                             dataObj = JSON.parse(dataObj);
//                         } catch (e) {
//                             // 解析失败，则保持为字符串，encryptJson会处理
//                         }
//                     }
                    
//                     // 加密数据
//                     const encryptedData = CryptoHelper.encryptJson(dataObj);
                    
//                     // 更新请求数据和类型
//                     options.data = JSON.stringify(encryptedData);

//                 } catch (error) {
//                     console.error('请求数据加密失败:', error);
//                 }
//             }
//         }

//         // --- 2. 响应解密 ---
//         const originalDataFilter = options.dataFilter;

//         options.dataFilter = function(data, type) {
//             let processedData = data;
//             if (originalDataFilter) {
//                 processedData = originalDataFilter.call(this, data, type);
//             }

//             if (!processedData) {
//                 return processedData;
//             }
//             try {
//                 processedData = JSON.parse(processedData);
//                 const decryptedData = decryptData(processedData.data);
//                 console.log('decryptedData', decryptedData);
//                 return decryptedData;
//             } catch (e) {
//                 console.error("响应数据解密失败:", e);
//                 return processedData;
//             }
//         };
//     });
// }