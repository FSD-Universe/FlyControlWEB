<script setup lang="ts">
import type {FormInstance, FormRules} from 'element-plus'
import {User, Lock, Message, Edit} from '@element-plus/icons-vue';
import {ref, reactive, Ref, onBeforeMount} from 'vue'
import {useRouter} from 'vue-router'

import ApiUser from "@/api/user.js";
import Api from "@/api/utils.js";
import type {SendEmailButtonInterface} from "@/components/SendEmailButton.js";
import SendEmailButton from "@/components/SendEmailButton.vue";
import config, {privatePolicy} from "@/config/index.js";
import {useUserStore} from "@/store/user.js";
import {useServerConfigStore} from "@/store/server_config.js";
import {showError, showSuccess} from "@/utils/message.js";
import {formatCid} from "@/utils/utils.js";
import DOMPurify from "dompurify";
import {marked} from "marked";
import {useReactiveWidth} from "@/composables/useReactiveWidth.js";

const serverConfig = useServerConfigStore();
const userStore = useUserStore();
const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);

const registerForm = reactive<RegisterData>({
    email: "",
    email_code: "",
    username: "",
    password: "",
    confirmPassword: "",
    agreePrivacy: false
})

const rules = reactive<FormRules>({
    cid: [
        {required: true, message: "请输入CID", trigger: "blur"},
        ...serverConfig.cidLimit
    ],
    username: [
        {required: true, message: "请输入用户名", trigger: "blur"},
        ...serverConfig.usernameLimit
    ],
    email: [
        {required: true, message: "'请输入邮箱", trigger: "blur"},
        ...serverConfig.emailLimit
    ],
    email_code: [
        {required: true, message: "请输入邮箱验证码", trigger: "blur"},
        {min: 6, max: 6, message: "邮箱验证码必须为6位", trigger: "blur"},
        {pattern: /^[0-9]+$/, message: "验证码必须为纯数字", trigger: "blur"}
    ],
    password: [
        {required: true, message: "请输入密码", trigger: "blur"},
        ...serverConfig.passwordLimit
    ],
    confirmPassword: [
        {required: true, message: "请再次输入密码", trigger: "blur"},
        {
            validator: (_, value: string, callback: Callback1<string | undefined>) => {
                if (value !== registerForm.password) {
                    callback("两次输入的密码不一致");
                } else {
                    callback();
                }
            },
            trigger: "blur"
        }
    ],
    agreePrivacy: [
        {
            required: true,
            validator: (_, value: boolean, callback: Callback1<string | undefined>) => {
                if (!value) {
                    callback("请阅读并同意隐私政策");
                } else {
                    callback();
                }
            },
            trigger: "change"
        }
    ]
})

const handleRegister = async () => {
    try {
        await formRef.value?.validate();
    } catch {
        return;
    }
    loading.value = true;
    registerForm.cid = Number(registerForm.cid);
    if (await ApiUser.userRegister(registerForm)) {
        showSuccess("注册成功，请登录");
        await router.push("/login");
    }
    loading.value = false;
}

const generatingCid = ref(false);

const getRandomInt = (max: number) => {
    return Math.floor(Math.random() * Math.floor(max));
}

const randomCid = async () => {
    let cid = 0;
    generatingCid.value = true;
    do {
        cid = getRandomInt(serverConfig.limits.cid_max);
    } while (!(await ApiUser.checkCID(cid)));
    registerForm.cid = formatCid(cid);
    generatingCid.value = false;
    await formRef.value?.validateField("cid");
}

const sendEmailBtnRef: Ref<SendEmailButtonInterface> = ref(false);

const sendEmailCode = async (callback: Callback1<boolean>) => {
    try {
        await formRef.value?.validateField("email");
    } catch {
        showError("邮箱验证失败");
        callback(false);
        return;
    }
    try {
        await formRef.value?.validateField("cid");
    } catch {
        showError("CID验证失败");
        callback(false);
        return;
    }
    if (await Api.sendEmailCode(registerForm.email, Number(registerForm.cid))) {
        showSuccess("验证码发送成功, 请查看邮箱");
        callback(true);
    } else {
        callback(false);
    }
}

const privacyPolicy = ref(false);

const openPrivacyPolicy = () => {
    privacyPolicy.value = true;
}

onBeforeMount(async () => {
    if (userStore.isLogin) {
        await router.push("/home");
    }
})

const {less1000px} = useReactiveWidth();
</script>

<template>
    <div class="register-container">
        <el-card class="register-box no-transform">
            <el-space>
                <img class="register-logo" :src="config.icon_path" alt="Icon"/>
                <div class="register-title">{{ config.title }}</div>
            </el-space>
            <el-form ref="formRef" :model="registerForm" :rules="rules" class="register-form">
                <el-form-item prop="cid">
                    <el-space>
                        <el-input v-model="registerForm.cid" placeholder="请输入cid"
                                  :prefix-icon="Edit" class="custom-input"/>
                        <el-button round type="primary" size="large" @click="randomCid()"
                                   :loading="generatingCid" :disabled="generatingCid">
                            随机CID
                        </el-button>
                    </el-space>
                </el-form-item>
                <el-form-item prop="username">
                    <el-input v-model="registerForm.username" placeholder="请输入用户名"
                              :prefix-icon="User" class="custom-input"/>
                </el-form-item>
                <el-form-item prop="email">
                    <el-input v-model="registerForm.email" placeholder="请输入邮箱"
                              :prefix-icon="Message" class="custom-input"/>
                </el-form-item>
                <el-form-item prop="email_code">
                    <el-space>
                        <el-input v-model="registerForm.email_code" placeholder="请输入邮箱验证码"
                                  :prefix-icon="Message" class="custom-input" :disabled="registerForm.email == ''"/>
                        <SendEmailButton ref="sendEmailBtnRef" @button-click-event="sendEmailCode"
                                         size="large" round :disabled="registerForm.email == ''"/>
                    </el-space>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input v-model="registerForm.password" type="password"
                              placeholder="请输入密码" :prefix-icon="Lock" show-password class="custom-input"/>
                </el-form-item>
                <el-form-item prop="confirmPassword">
                    <el-input v-model="registerForm.confirmPassword" type="password"
                              placeholder="请确认密码" :prefix-icon="Lock" show-password class="custom-input"/>
                </el-form-item>
                <el-form-item prop="agreePrivacy">
                    <el-checkbox v-model="registerForm.agreePrivacy" class="privacy-checkbox">
                        我已阅读并同意<a href="javascript:void(0)" @click="openPrivacyPolicy" class="privacy-link">《隐私政策》</a>
                    </el-checkbox>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleRegister" :loading="loading" class="register-button">
                        注册
                    </el-button>
                </el-form-item>
            </el-form>
            <div class="register-footer">
                <router-link to="/login" class="register-link">已有账号？立即登录</router-link>
            </div>
        </el-card>
    </div>
    <el-dialog v-model="privacyPolicy"
               title="隐私政策"
               :close-on-click-modal="false"
               :close-on-press-escape="false"
               :show-close="false"
               :width="less1000px ? '100%' : '80%'"
    >
        <div v-html="DOMPurify.sanitize(marked.parse(privatePolicy))" class="content"/>
        <div class="footer">
            <el-button @click="privacyPolicy = false;registerForm.agreePrivacy = true" type="primary">
                我已阅读并同意隐私政策
            </el-button>
        </div>
    </el-dialog>
</template>

<style scoped>
.content {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    font-family: '微软雅黑', "Lato", Helvetica, "Roboto", Arial, sans-serif;
}

.content :deep(p) {
    margin: 5px 0;
}

.content :deep(table) {
    border-collapse: collapse;
    border: 1px solid black;
}

.content :deep(th),
.content :deep(td) {
    padding: 5px;
    border: 1px solid black;
}

.content :deep(ul),
.content :deep(ol) {
    margin-left: 20px;
}

.footer {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    width: 100vw;
    transition: background-image 1.5s ease-in-out;
    background-image: url("/images/background.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center center;
    position: fixed;
    top: 0;
    left: 0;
    overflow: hidden;
}

.register-box {
    width: 400px;
    padding: 40px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    background: var(--secondary-bg-color);
    backdrop-filter: blur(10px);
    position: relative;
    z-index: 1;
    border: none;
}

.register-logo {
    width: 50px;
    height: 50px;
}

.register-title {
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
    background-clip: text;
    color: transparent;
}

.register-form {
    margin-top: 24px;
}

.custom-input {
    --el-input-height: 48px;
    --el-input-border-radius: 8px;
    --el-input-bg-color: var(--el-fill-color-light);
    --el-input-border-color: var(--el-border-color);
    --el-input-hover-border-color: var(--primary-color);
    --el-input-focus-border-color: var(--primary-color);
}

.custom-input :deep(.el-input__wrapper) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.custom-input :deep(.el-input__wrapper:hover) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.custom-input :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.register-button {
    width: 100%;
    height: 48px;
    font-size: 16px;
    border-radius: 8px;
    background-image: linear-gradient(45deg, var(--primary-color), var(--accent-color));
    border: none;
    transition: all 0.3s ease;
}

.register-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background-image: linear-gradient(45deg, var(--primary-color), var(--accent-color), var(--primary-color));
    background-size: 200%;
    animation: gradient-animation 3s ease infinite;
}

.register-footer {
    margin-top: 12px;
    text-align: center;
}

.register-link {
    color: var(--primary-color);
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;
    cursor: pointer;
}

.register-link:hover {
    color: var(--accent-color);
    text-decoration: underline #409eff solid 1px;
}

.privacy-checkbox {
    width: 100%;
    margin-top: 10px;
}

.privacy-link {
    color: var(--primary-color);
    text-decoration: none;
}

.privacy-link:hover {
    text-decoration: underline;
}

@media (max-width: 480px) {
    .register-box {
        width: 90%;
        padding: 24px;
        margin: 0;
    }

    .register-title {
        font-size: 24px;
    }

    .register-logo {
        width: 60px;
        height: 60px;
    }
}
</style>