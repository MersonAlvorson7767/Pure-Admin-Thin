export function runGlobal(code: string) {
  // 非严格模式函数，this 指向调用对象；用 call(window) 强制把 this 设为 window
  // 如果你的脚本里包含 "use strict"，依然可以用 call(window) 指定 this
  // 若你的 CSP 禁止 eval/Function，这种方式会被拦截，请改用方案 A 或 <script> 注入
  // eslint-disable-next-line no-new-func
  return new Function(code).call(window);
}