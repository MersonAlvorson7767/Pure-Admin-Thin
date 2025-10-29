<template>
  <div class="toast-wrap">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="incoming-toast"
      @click="open(t)"
    >
      <div class="toast-body">
        <div class="toast-title">{{ t.title }}</div>
        <div class="toast-text">{{ t.content }}</div>
      </div>
      <button class="toast-close" type="button" @click.stop="closeOne(t)">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

type Toast = { id: number; chatId: number; title: string; content: string; timer?: any; };

const emit = defineEmits<{ (e:"open-chat", chatId:number): void }>();
const toasts = ref<Toast[]>([]);

function notify(p: { chatId:number; title:string; content:string }) {
  const id = Date.now() + Math.floor(Math.random()*1000);
  const t: Toast = { id, chatId: p.chatId, title: p.title, content: p.content };
  toasts.value.push(t);
  t.timer = setTimeout(() => closeOne(t), 5000);
}
function closeOne(t: Toast) {
  if (t.timer) clearTimeout(t.timer);
  toasts.value = toasts.value.filter(x => x.id !== t.id);
}
function open(t: Toast) {
  emit("open-chat", t.chatId);
  closeOne(t);
}

defineExpose({ notify });
</script>

<style scoped>
.toast-wrap {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147483647;
  display: flex; flex-direction: column; gap: 10px;
}
.incoming-toast {
  max-width: min(88vw, 420px);
  background: linear-gradient(90deg, #ff7a59 0%, #ffb86b 100%);
  color: #fff;
  border-radius: 14px;
  box-shadow: 0 16px 36px rgba(255, 122, 89, .35);
  padding: 12px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
}
.toast-body { display: flex; flex-direction: column; gap: 2px; font-weight: 800; }
.toast-title { font-size: 14px; line-height: 1.25; margin: 0; }
.toast-text { font-size: 13px; line-height: 1.35; opacity: .95; margin: 0; font-weight: 600; word-break: break-word; }
.toast-close {
  margin-left: auto;
  background: rgba(255,255,255,.25);
  color: #fff; border: 0; width: 24px; height: 24px; border-radius: 999px;
  font-weight: 900; line-height: 1; display: inline-flex; align-items:center; justify-content:center;
}
.toast-close:hover { background: rgba(255,255,255,.35); }
</style>