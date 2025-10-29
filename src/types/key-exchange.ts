declare global {
  interface Window {
    keyExchangePromise?: Promise<string>;
  }
}
export {};