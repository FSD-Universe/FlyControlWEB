<script setup lang="ts">

import {homeConfig} from "@/config/index.js";
import {Global} from "@/global.js";
</script>

<template>
    <el-space wrap class="footer">
        <span>Copyright © 2025 {{ homeConfig.content.copyright }} All rights reserved.</span>
        <span>v{{ Global.version }}</span>
        <span class="flex align-items-center"><el-link href="https://beian.miit.gov.cn/">{{ homeConfig.content.icp }}</el-link></span>
        <span class="flex align-items-center flex-direction-row">
            <img src="/images/icp.png" alt="ICP" style="height: 14px">
            <el-link :href="homeConfig.content.icp_police_url">
                {{ homeConfig.content.icp_police }}
            </el-link>
        </span>
        <span>仅供模拟飞行使用</span>
    </el-space>
</template>

<style scoped>
.footer {
    display: flex;
    border: none;
    font-size: var(--el-font-size-base);
    justify-content: center;
    align-items: center;
    padding: 0 5px;
    text-align: center;
    width: 100%;
}
</style>