<template>
  <el-dialog v-model="innerVisible" :title="$t('smsChat.pureBatchSend')" width="980px" @opened="onOpened" @closed="onClosed">
    <!-- 顶部提示与选项 -->
    <el-alert type="warning" :title="$t('smsChat.pureBatchTip') || '请先选择或编辑短信内容，再粘贴号码（每行一个）。超过单条最大字符会按多条计费。'" show-icon class="mb12" />
    <div class="option-row">
      <el-checkbox v-model="enableSplit">{{ $t('smsChat.pureEnableSplit') }}</el-checkbox>
      <el-checkbox v-if="existsUsingOldCardAvailable" v-model="existsUsingOldCard">重复粉用之前用过的手机号发送</el-checkbox>
    </div>

    <div class="grid-2">
      <!-- 左列：短信内容（带模板、行号、重复覆盖高亮、去重与错误提示） -->
      <div class="col">
        <div class="section-title">短信内容</div>
        <el-select v-model="templateId" placeholder="选择模板" class="w100 mb8" @change="onTemplateChange" :loading="loadingTpl">
          <el-option :label="'话术自定义（最少'+ CUSTOM_SCRIPT_MIN +'条起）'" :value="'0'" />
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="String(t.id)" />
        </el-select>

        <div class="areacontainer">
          <div ref="scriptNumsRef" class="areanumbers"></div>
          <!-- 覆盖层：仅把重复行渲染为红色，其余透明以显示下方 textarea 的内容 -->
          <div ref="scriptOverlayRef" class="areahighlight"></div>
          <textarea
            ref="scriptTaRef"
            class="areatextarea"
            v-model="scriptContent"
            :placeholder="$t('smsChat.pureBatchContent') || '请输入内容'"
            @scroll="syncOverlayScroll"
            @input="scheduleValidate"
          />
        </div>

        <div class="script-actions">
          <el-button size="small" type="danger" plain @click="dedupeScripts">一键去重</el-button>
          <div class="form-error" :class="{ show: !!errorMsg }">{{ errorMsg }}</div>
        </div>
      </div>

      <!-- 右列：号码（带行号与计数） -->
      <div class="col">
        <div class="section-title">请输入号码（每行一个）</div>
        <div class="areacontainer">
          <div ref="phoneNumsRef" class="areanumbers"></div>
          <textarea
            ref="phoneTaRef"
            class="areatextarea"
            v-model="phones"
            :placeholder="$t('smsChat.pureBatchPhones') || '每行一个号码'"
            @input="scheduleValidate"
          />
        </div>
        <div class="stat-note mt8">当前号码总计：<b>{{ phoneCount }}</b></div>
      </div>
    </div>

    <template #footer>
      <el-button @click="innerVisible=false">{{ $t('buttons.pureCancel') }}</el-button>
      <el-button type="primary" :disabled="!!errorMsg" @click="doSend">{{ $t('buttons.pureConfirm') }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { apiBatchSendText, apiListTemplates, apiTemplateDetail } from "@/api/smsChat";

/* props / emits */
const props = defineProps<{
  visible: boolean;
  existsUsingOldCardAvailable?: boolean; // 是否显示“重复粉复用旧手机号”
}>();
const emit = defineEmits<{
  (e:"update:visible", v:boolean): void;
  (e:"sent"): void;
}>();

/* 最少条数：自定义脚本（模板 id = '0'）时生效 */
const CUSTOM_SCRIPT_MIN = 50;

/* v-model:visible */
const innerVisible = computed({
  get: () => props.visible,
  set: (v) => emit("update:visible", v)
});

/* 顶部开关 */
const enableSplit = ref(true);
const existsUsingOldCard = ref(false);

/* 模板 */
const templateId = ref<string>("0");
const templates = ref<Array<{id:number|string; name:string}>>([]);
const loadingTpl = ref(false);

/* 文本与号码 */
const scriptContent = ref("");
const phones = ref("");

/* 号码计数 */
const phoneCount = computed(() => (phones.value || "").split(/\r?\n/).filter(s => s.trim().length > 0).length);

/* 错误消息（控制按钮禁用） */
const errorMsg = ref("");

/* 去重与高亮辅助 */
function normalizeScriptLine(s: string) {
  return (s || "").trim().replace(/\s+/g, " ").toLowerCase();
}

/* DOM refs：脚本文本域与覆盖层/行号，号码文本域与行号 */
const scriptTaRef = ref<HTMLTextAreaElement | null>(null);
const scriptOverlayRef = ref<HTMLDivElement | null>(null);
const scriptNumsRef = ref<HTMLDivElement | null>(null);
const phoneTaRef = ref<HTMLTextAreaElement | null>(null);
const phoneNumsRef = ref<HTMLDivElement | null>(null);

let roScript: ResizeObserver | null = null;
let roPhone: ResizeObserver | null = null;
let rafId: number | null = null;

function cancelRAF() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
}
function scheduleValidate() {
  cancelRAF();
  rafId = requestAnimationFrame(validateAllUI);
}

/* 行号计算（按原逻辑：不考虑软换行的切分，仅按“显示行”= 原行数） */
function renderLineNumbers(textarea: HTMLTextAreaElement | null, numbers: HTMLDivElement | null) {
  if (!textarea || !numbers) return;
  const lines = (textarea.value || "").split(/\r?\n/);
  // 同步字体与内边距，保证视觉对齐
  const taStyles = window.getComputedStyle(textarea);
  ["fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","padding","paddingTop","paddingRight","paddingBottom","paddingLeft"].forEach((prop) => {
    (numbers.style as any)[prop] = (taStyles as any)[prop];
  });
  // 高度
  numbers.style.height = `${textarea.clientHeight}px`;
  numbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join("");
}

/* 重复覆盖高亮：仅对“非空行”做去重，重复行标红，其余透明 */
function renderDuplicateOverlay(textarea: HTMLTextAreaElement | null, overlay: HTMLDivElement | null) {
  if (!textarea || !overlay) return;
  // 定位尺寸对齐
  const rect = textarea.getBoundingClientRect();
  const taStyles = getComputedStyle(textarea);
  overlay.style.left = `${textarea.offsetLeft}px`;
  overlay.style.top = `${textarea.offsetTop}px`;
  overlay.style.width = `${textarea.clientWidth}px`;
  overlay.style.height = `${textarea.clientHeight}px`;
  ["fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","padding","paddingTop","paddingRight","paddingBottom","paddingLeft","textIndent"]
    .forEach((prop) => { (overlay.style as any)[prop] = (taStyles as any)[prop]; });

  const raw = textarea.value || "";
  const lines = raw.split(/\r?\n/);
  // 计算重复：key -> index[]
  const key2Idxs = new Map<string, number[]>();
  lines.forEach((s, i) => {
    const key = normalizeScriptLine(s);
    if (!key) return;
    if (!key2Idxs.has(key)) key2Idxs.set(key, [i]); else key2Idxs.get(key)!.push(i);
  });
  const dupIndexSet = new Set<number>();
  key2Idxs.forEach((arr) => { if (arr.length > 1) arr.forEach((i) => dupIndexSet.add(i)); });

  const html = lines.map((line, idx) => {
    const cls = dupIndexSet.has(idx) ? "dup" : "normal";
    const esc = (line || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    return `<span class="${cls}">${esc || " "}</span>`;
  }).join("\n");
  overlay.innerHTML = html;
  // 滚动同步
  overlay.scrollTop = textarea.scrollTop;
  overlay.scrollLeft = textarea.scrollLeft;

  // 同步行号标红
  if (scriptNumsRef.value) {
    const children = Array.from(scriptNumsRef.value.querySelectorAll("div"));
    children.forEach((div) => div.classList.remove("line-dup"));
    Array.from(dupIndexSet).forEach((i) => {
      const el = children[i]; if (el) el.classList.add("line-dup");
    });
  }
}

function syncOverlayScroll() {
  if (!scriptTaRef.value || !scriptOverlayRef.value) return;
  scriptOverlayRef.value.scrollTop = scriptTaRef.value.scrollTop;
  scriptOverlayRef.value.scrollLeft = scriptTaRef.value.scrollLeft;
}

/* 整体验证与 UI 联动 */
function validateAllUI() {
  const ta = scriptTaRef.value;
  const phoneTa = phoneTaRef.value;
  // 行号
  renderLineNumbers(ta, scriptNumsRef.value);
  renderLineNumbers(phoneTa, phoneNumsRef.value);
  // 覆盖高亮
  renderDuplicateOverlay(ta, scriptOverlayRef.value);

  // 校验：内容不能为空；若模板=自定义（'0'），非空行数 >= CUSTOM_SCRIPT_MIN
  const nonEmptyScripts = (scriptContent.value || "").split(/\r?\n/).map((s)=>s.trim()).filter((s)=>s.length>0);
  const nonEmptyPhones = (phones.value || "").trim();

  let err = "";
  if (nonEmptyScripts.length === 0) err = "不能发送空消息";
  else if (templateId.value === "0" && nonEmptyScripts.length < CUSTOM_SCRIPT_MIN) err = `至少需要 ${CUSTOM_SCRIPT_MIN} 条话术，当前 ${nonEmptyScripts.length} 条`;
  else if (!nonEmptyPhones) err = "请输入号码";
  errorMsg.value = err;
}

/* 一键去重（脚本内容） */
function dedupeScripts() {
  const lines = (scriptContent.value || "").split(/\r?\n/);
  const seen = new Set<string>();
  const out: string[] = [];
  let removed = 0;
  for (const raw of lines) {
    const key = normalizeScriptLine(raw);
    if (!key) continue;
    if (!seen.has(key)) { seen.add(key); out.push(raw); } else { removed++; }
  }
  scriptContent.value = out.join("\r\n");
  scheduleValidate();
  if (removed > 0) ElMessage.success(`已去重：移除 ${removed} 条，保留 ${out.length} 条`);
}

/* 模板加载与切换 */
async function loadTemplates() {
  loadingTpl.value = true;
  try {
    const res: any = await apiListTemplates();
    const list = (res?.data?.list || []).map((x: any) => ({ id: x.id, name: x.name }));
    templates.value = list;
    // 默认选中后端 last（如果有）
    const last = String(res?.data?.last ?? "");
    if (last && list.find((x)=>String(x.id)===last)) {
      templateId.value = last;
      await loadTemplateDetail(last);
    } else {
      templateId.value = "0";
      scriptContent.value = "";
    }
  } finally {
    loadingTpl.value = false;
    scheduleValidate();
  }
}
async function loadTemplateDetail(id: string) {
  const res: any = await apiTemplateDetail(id);
  const arr = (res?.data || []) as Array<{ sms: string }>;
  scriptContent.value = arr.map((x) => x.sms || "").join("\r\n");
  await nextTick();
  scheduleValidate();
}
async function onTemplateChange(v: string) {
  if (v === "0") {
    scriptContent.value = "";
    scheduleValidate();
    return;
  }
  await loadTemplateDetail(v);
}

/* 发送 */
async function doSend() {
  if (errorMsg.value) {
    ElMessage.error(errorMsg.value);
    return;
  }
  const res: any = await apiBatchSendText({
    batchPhone: phones.value,
    batchContent: scriptContent.value,
    enableSplit: enableSplit.value,
    existsUsingOldCard: props.existsUsingOldCardAvailable ? existsUsingOldCard.value : undefined,
    templateId: templateId.value === "0" ? undefined : templateId.value
  });
  if (res?.scode === 0 || res?.data === 1000) {
    ElMessage.success("提交成功，任务进入队列");
    innerVisible.value = false;
    emit("sent");
  } else {
    ElMessage.error(res?.data || "发送失败");
  }
}

/* 生命周期与对话框开关 */
function onOpened() {
  // 初次打开：拉模板，初始化校验 + 监听尺寸
  loadTemplates();
  nextTick(() => {
    scheduleValidate();
    // 监听尺寸变化，重算行号与覆盖层
    if (scriptTaRef.value && !roScript) {
      roScript = new ResizeObserver(() => scheduleValidate());
      roScript.observe(scriptTaRef.value);
    }
    if (phoneTaRef.value && !roPhone) {
      roPhone = new ResizeObserver(() => scheduleValidate());
      roPhone.observe(phoneTaRef.value);
    }
  });
}
function onClosed() {
  // 重置
  enableSplit.value = true;
  existsUsingOldCard.value = false;
  templateId.value = "0";
  scriptContent.value = "";
  phones.value = "";
  errorMsg.value = "";
  cancelRAF();
}

watch(innerVisible, (v) => {
  if (v) return; // closed handled by @closed
});

/* 清理 */
onBeforeUnmount(() => {
  if (roScript && scriptTaRef.value) roScript.unobserve(scriptTaRef.value);
  if (roPhone && phoneTaRef.value) roPhone.unobserve(phoneTaRef.value);
  roScript = null; roPhone = null;
  cancelRAF();
});

onMounted(() => {
  // 只保证首次引入时不报空
});
</script>

<style scoped>
.mb8 { margin-bottom: 8px; }
.mb12 { margin-bottom: 12px; }
.mt8 { margin-top: 8px; }
.w100 { width: 100%; }

/* 顶部选项 */
.option-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }

/* 双列布局 */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.col { display: flex; flex-direction: column; }
.section-title { font-weight: 800; color: #334155; margin-bottom: .35rem; }

/* 行号编辑器样式（与原页一致） */
.areacontainer {
  position: relative;
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  background: #fff;
  box-shadow: 0 2px 10px rgba(2, 6, 23, .04) inset;
}
.areanumbers {
  border-right: 1px solid #e2e8f0;
  text-align: right;
  background: #fff7f3;
  color: #8a3b1e;
  min-width: 48px;
  padding: 8px 6px;
  font-family: monospace;
  user-select: none;
  overflow: hidden;
}
.areanumbers > div { font-family: monospace; }
.areanumbers .line-dup { color: #ef4444; font-weight: 800; }

.areatextarea {
  flex: 1;
  padding: 10px 12px;
  border: none;
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  min-height: 220px;
  overflow-x: hidden;
  font-family: monospace;
}

/* 覆盖层：叠在脚本文本域上层，重复为红色 */
.areahighlight {
  position: absolute;
  pointer-events: none;      /* 不挡输入 */
  white-space: pre-wrap;
  overflow: hidden;
  color: transparent;        /* 非重复行透明，显示下面 textarea 的文字 */
  z-index: 3;
}
.areahighlight .dup    { color: #ef4444; font-weight: 700; }
.areahighlight .normal { color: transparent; }

/* 底部操作行与错误提示 */
.script-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}
.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
  visibility: hidden;
}
.form-error.show { visibility: visible; }

/* 小提示 */
.stat-note { color: #64748b; font-size: 12px; }
</style>