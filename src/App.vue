<script setup lang="ts">
import {onMounted, ref} from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import {Global} from "@/global.js";
import {Check} from "@element-plus/icons-vue";
import CookieConsent from "@/components/CookieConsent.vue";

const currentLocale = ref(zhCn)
const currentVersion = ref('')
const showVersionDialog = ref(false)

const onShowVersionDialogClose = () => {
    currentVersion.value = Global.version
    localStorage.setItem('version', Global.version)
}

onMounted(() => {
    currentVersion.value = localStorage.getItem('version') || ''
    if (currentVersion.value != Global.version) {
        showVersionDialog.value = true
    }
})

</script>

<template>
    <div class="container">
        <el-config-provider :locale="currentLocale">
            <router-view></router-view>
        </el-config-provider>
    </div>
    <el-dialog v-model="showVersionDialog" @close="onShowVersionDialogClose()"
               :close-on-press-escape="false" :close-on-click-modal="false" :show-close="false">
        <template #header>
            飞控已更新至: {{ Global.version }}
        </template>
        <div v-html="Global.whatsNew"/>
        <template #footer>
            <el-button type="primary" :icon="Check" @click="showVersionDialog = false">确认</el-button>
        </template>
    </el-dialog>
    <CookieConsent/>
</template>

<style scoped>
.container {
    height: 100%;
    width: 100%;
    overflow: hidden;
}
</style>
