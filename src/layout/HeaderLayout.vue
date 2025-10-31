<script setup lang="ts">
import Header from "@/components/Header.vue";
import Footer from "@/components/Footer.vue";
import {useMediaQuery} from "@vueuse/core";

const less560px = useMediaQuery("(max-width: 560px)");
</script>

<template>
    <el-container class="w-full h-full flex align-items-center">
        <el-header class="w-full">
            <Header/>
        </el-header>
        <el-main class="main">
            <router-view></router-view>
            <Footer v-if="less560px"/>
        </el-main>
        <el-footer class="flex align-items-center" v-if="!less560px">
            <Footer/>
        </el-footer>
    </el-container>
</template>

<style scoped>
.el-container {
    align-items: center;
    transition: background-color 0.5s ease-in-out;
    background: rgba(255, 255, 255, 0.8) url("/images/background.png") no-repeat center center;
    background-size: cover;
    background-blend-mode: overlay;
}

.dark .el-container {
    align-items: center;
    background: rgba(0, 0, 0, 0.8) url("/images/background.png") no-repeat center center;
    background-size: cover;
    background-blend-mode: overlay;
}

.el-header {
    --el-header-padding: 0px;
    backdrop-filter: blur(10px);
    background-image: linear-gradient(45deg, rgba(66, 60, 90, 0.15), rgba(66, 60, 90, 0.15));
}

.el-footer {
    --el-footer-height: auto;
    width: 100vw;
    border-top: 1px solid var(--el-border-color);
}

.main {
    flex-grow: 1;
    display: flex;
    width: 100%;
    flex-direction: column;
    align-items: center;
}
</style>