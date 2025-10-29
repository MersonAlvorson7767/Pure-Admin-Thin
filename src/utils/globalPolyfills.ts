// 让某些库在浏览器里能找到 global/globalThis
if (typeof (window as any).global === "undefined") (window as any).global = window;
if (typeof (window as any).globalThis === "undefined") (window as any).globalThis = window;

// 旧版脚本里会用到 jsrsasign 命名空间（被 jsencrypt 组合包引用），先兜底
if (typeof (window as any).KJUR === "undefined") (window as any).KJUR = {};

export {};