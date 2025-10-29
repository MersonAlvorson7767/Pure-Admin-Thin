<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Motion from './utils/motion';
import { useRouter } from 'vue-router';
import { message } from '@/utils/message';
import { loginRules } from './utils/rule';
import { ref, reactive, toRaw, onMounted } from 'vue';
import { debounce } from '@pureadmin/utils';
import { useNav } from '@/layout/hooks/useNav';
import { useEventListener } from '@vueuse/core';
import type { FormInstance } from 'element-plus';
import { $t, transformI18n } from '@/plugins/i18n';
import { useLayout } from '@/layout/hooks/useLayout';
import { useUserStoreHook } from '@/store/modules/user';
import { initRouter, getTopMenu } from '@/router/utils';
import { bg, avatar, illustration } from './utils/static';
import { useRenderIcon } from '@/components/ReIcon/src/hooks';
import { useTranslationLang } from '@/layout/hooks/useTranslationLang';
import { useDataThemeChange } from '@/layout/hooks/useDataThemeChange';
import dayIcon from '@/assets/svg/day.svg?component';
import darkIcon from '@/assets/svg/dark.svg?component';
import globalization from '@/assets/svg/globalization.svg?component';
import Lock from '~icons/ri/lock-fill';
import Check from '~icons/ep/check';
import User from '~icons/ri/user-3-fill';
import { http } from '@/utils/http';
import { setToken } from '@/utils/auth';
import cryptoUtil from '@/utils/crypto';

defineOptions({ name: 'Login' });

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();

const { initStorage } = useLayout();
initStorage();

const { t } = useI18n();
const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title, getDropdownItemStyle, getDropdownItemClass } = useNav();
const { locale, translationCh, translationEn } = useTranslationLang();

const ruleForm = reactive({
    account: 'admin',
    password: 'admin123'
});

// 旧版兜底：仅在没有 window.keyExchangePromise 时才会用到
const exchangeKey = async () => {
    try {
        const publicKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDV8DXtwoFkWS0LRK5nErpZhuX4
/FZem4IOVh7R6VhVQKQo5jTSoappMM0quZ7y0RwFiMCWKB809wqFC+7KHbTgdnG2
NN+dwpUqzdm+ww4DA6E7TlX6AvXfHXSVfhv3ef0v1vDc95o4IJoZK0VEBRGjE2BG
9gd4RHQKyokpv1EWtwIDAQAB
-----END PUBLIC KEY-----`;
        const response = await fetch('/api/s', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey })
        });
        const res = await response.json();
        if (res && res.sv && res.data) {
            sessionStorage.setItem('sv', res.sv);
            sessionStorage.setItem('sd', res.data); // 注意：这一步只是旧返回的“加密态”，不解密
            cryptoUtil.setSessionKey(res.data); // 仅兜底；真正 sd 以 key-exchange.js 解密后的为准
            console.log('密钥交换成功(兜底路径)');
        } else {
            console.error('密钥交换响应缺少必要字段');
        }
    } catch (error) {
        console.error('密钥交换失败(兜底路径):', error);
    }
};

// 使用 key-exchange.js 的 Promise，拿到“真正的 sd”
onMounted(async () => {
    try {
        if (window.keyExchangePromise) {
            const realSd = await window.keyExchangePromise; // 旧脚本已用 RSA 私钥解密后的真正 sd
            const sd = realSd || sessionStorage.getItem('sd') || '';
            if (!sd || sd.length < 16) {
                console.error('密钥交换结果异常，sd 缺失或长度不足');
            } else {
                // 同步给你的加解密工具
                cryptoUtil.setSessionKey(sd);
                console.log('密钥交换成功 sv=', sessionStorage.getItem('sv'), ' sd.len=', sd.length);
            }
        } else {
            console.error('keyExchangePromise 未注入，请确认 key-exchange.js 已在入口引入');
        }
    } catch (e) {
        console.error('密钥交换失败：', e);
    }
});

const onLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return;
    await formEl.validate(async (valid) => {
        if (!valid) return;
        loading.value = true;
        try {
            const res: any = await http.post('/user/login', {
                data: {
                    account: ruleForm.account, // 后端需要 account，不是 username
                    password: ruleForm.password
                }
            });
            const userStore = useUserStoreHook();
            if (res?.success || res?.code === 200 || res?.scode === 0) {
                setToken({
                    accessToken: res.data.accessToken ?? res.data.token,
                    refreshToken: res.data.refreshToken,
                    expires: res.data.expires
                });
                if (typeof (userStore as any).setUserInfo === 'function') {
                    (userStore as any).setUserInfo(res.data);
                } else if (typeof (userStore as any).setUserInfos === 'function') {
                    (userStore as any).setUserInfos(res.data);
                } else {
                    // 兜底：直接 patch。根据你的 store 实际字段名调整 userInfo / userInfos
                    userStore.$patch({
                        userInfo: res.data
                    });
                }
                await initRouter();
                const menu = getTopMenu(true);
                const targetPath = (typeof menu === 'string' ? menu : menu?.path) || '/';

                const canMatch = !!targetPath && router.resolve({ path: targetPath }).matched.length > 0;

                // 如果找不到该路由，打印当前可用路由并回退到首页（或你确定存在的路由）
                if (!canMatch) {
                    console.warn(
                        'No route match for:',
                        targetPath,
                        'Available routes:',
                        router.getRoutes().map((r) => r.path)
                    );
                    await router.push('/'); // 或改为已存在的默认页，比如 "/dashboard"
                } else {
                    await router.push(targetPath);
                }
                message(t('login.pureLoginSuccess'), { type: 'success' });
            } else {
                message(res?.message || res?.smsg || t('login.pureLoginFail'), { type: 'error' });
            }
        } catch (error: any) {
            console.log('login error decrypted:', error?.response?.data);
            const msg = error?.response?.data?.message || error?.response?.data?.smsg || error?.message || t('login.pureLoginFail');
            message(msg, { type: 'error' });
            console.error('登录失败:', error);
        } finally {
            loading.value = false;
        }
    });
};

const immediateDebounce: any = debounce((formRef) => onLogin(formRef), 1000, true);
useEventListener(document, 'keydown', ({ code }) => {
    if (['Enter', 'NumpadEnter'].includes(code) && !disabled.value && !loading.value) {
        immediateDebounce(ruleFormRef.value);
    }
});
</script>

<template>
    <div class="select-none">
        <img :src="bg" class="wave" />
        <div class="flex-c absolute right-5 top-3">
            <!-- 主题 -->
            <el-switch v-model="dataTheme" inline-prompt :active-icon="dayIcon" :inactive-icon="darkIcon" @change="dataThemeChange" />
            <!-- 国际化 -->
            <el-dropdown trigger="click">
                <globalization class="hover:text-primary hover:bg-[transparent]! w-[20px] h-[20px] ml-1.5 cursor-pointer outline-hidden duration-300" />
                <template #dropdown>
                    <el-dropdown-menu class="translation">
                        <el-dropdown-item :style="getDropdownItemStyle(locale, 'zh')" :class="['dark:text-white!', getDropdownItemClass(locale, 'zh')]" @click="translationCh">
                            <IconifyIconOffline v-show="locale === 'zh'" class="check-zh" :icon="Check" />
                            简体中文
                        </el-dropdown-item>
                        <el-dropdown-item :style="getDropdownItemStyle(locale, 'en')" :class="['dark:text-white!', getDropdownItemClass(locale, 'en')]" @click="translationEn">
                            <span v-show="locale === 'en'" class="check-en">
                                <IconifyIconOffline :icon="Check" />
                            </span>
                            English
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <div class="login-container">
            <div class="img">
                <component :is="toRaw(illustration)" />
            </div>
            <div class="login-box">
                <div class="login-form">
                    <avatar class="avatar" />
                    <Motion>
                        <h2 class="outline-hidden">{{ title }}</h2>
                    </Motion>

                    <el-form ref="ruleFormRef" :model="ruleForm" :rules="loginRules" size="large">
                        <Motion :delay="100">
                            <el-form-item
                                :rules="[
                                    {
                                        required: true,
                                        message: transformI18n($t('login.pureUsernameReg')),
                                        trigger: 'blur'
                                    }
                                ]"
                                prop="account"
                            >
                                <el-input v-model="ruleForm.account" clearable :placeholder="t('login.pureUsername')" :prefix-icon="useRenderIcon(User)" />
                            </el-form-item>
                        </Motion>

                        <Motion :delay="150">
                            <el-form-item prop="password">
                                <el-input v-model="ruleForm.password" clearable show-password :placeholder="t('login.purePassword')" :prefix-icon="useRenderIcon(Lock)" />
                            </el-form-item>
                        </Motion>

                        <Motion :delay="250">
                            <el-button class="w-full mt-4!" size="default" type="primary" :loading="loading" :disabled="disabled" @click="onLogin(ruleFormRef)">
                                {{ t('login.pureLogin') }}
                            </el-button>
                        </Motion>
                    </el-form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('@/style/login.css');
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
    padding: 0;
}

.translation {
    ::v-deep(.el-dropdown-menu__item) {
        padding: 5px 40px;
    }

    .check-zh {
        position: absolute;
        left: 20px;
    }

    .check-en {
        position: absolute;
        left: 20px;
    }
}
</style>
