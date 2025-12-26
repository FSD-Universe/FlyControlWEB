<script setup lang="ts">
import {ref, onMounted} from 'vue';
import Clarity from '@microsoft/clarity';

const cookieConsent = ref<boolean | null>(null);

onMounted(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (consent !== null) {
        cookieConsent.value = consent === 'true';
    } else {
        cookieConsent.value = null;
    }
});

const acceptConsent = () => {
    localStorage.setItem('cookie_consent', 'true');
    cookieConsent.value = true;
    Clarity.consentV2();
};

const declineConsent = () => {
    localStorage.setItem('cookie_consent', 'false');
    cookieConsent.value = false;
    Clarity.consentV2({ad_Storage: 'denied', analytics_Storage: 'denied'});
};

</script>

<template>
    <div class="cookie-consent" v-if="cookieConsent == null">
        <div class="cookie-consent-content">
            <div class="cookie-consent-header">
                <h3>Cookie 许可</h3>
            </div>
            <div class="cookie-consent-body">
                <p>我们使用必要的 Cookie 来确保网站正常运行。</p>
                <p>我们还使用分析 Cookie来了解用户如何与网站交互，这有助于我们改进服务。</p>
                <p>您可以通过"接受"来同意使用分析 Cookie，或通过"拒绝"来仅使用必要的Cookie。</p>
            </div>
            <el-space>
                <el-button type="default" @click="declineConsent" class="consent-btn">拒绝</el-button>
                <el-button type="primary" @click="acceptConsent" class="consent-btn">接受</el-button>
            </el-space>
        </div>
    </div>
</template>

<style scoped>
.cookie-consent {
    position: fixed;
    bottom: 30px;
    left: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 600px;
}

.cookie-consent-content {
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
}

.cookie-consent-header {
    margin-bottom: 10px;
}

.cookie-consent-header h3 {
    margin: 0;
    font-size: 1.2em;
    color: var(--el-text-color-primary);
}

.cookie-consent-body {
    margin-bottom: 15px;
}

.cookie-consent-body p {
    margin: 0;
    color: var(--el-text-color-regular);
    font-size: 0.9em;
    line-height: 1.5;
}

.consent-btn {
    height: 36px;
}

@media (max-width: 768px) {
    .cookie-consent {
        left: 10px;
        right: 10px;
        bottom: 20px;
        max-width: none;
    }

    .consent-btn {
        width: 100%;
    }
}
</style>
