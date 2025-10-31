<script setup lang="ts">
import {homeConfig} from "@/config/index.js";

const jumpToUrl = (url: string) => {
    window.open(url, '_blank');
}
</script>

<template>
    <div class="container">
        <span class="title">软件下载</span>
        <div class="content">
            <el-row :gutter="10" v-if="homeConfig.software.length != 0" class="justify-content-center">
                <el-col v-for="item in homeConfig.software" :span="24" :sm="12">
                    <el-card>
                        <template #header>
                            <el-space class="flex justify-content-between w-full">
                                <span>{{ item.name }}</span>
                                <el-tag round effect="dark" type="success">{{ item.version }}</el-tag>
                            </el-space>
                        </template>
                        <span>{{ item.description }}</span>
                        <template #footer>
                            <el-space wrap class="flex justify-content-between w-full">
                                <el-space wrap>
                                    <el-tag size="large" round v-if="item.platform.windows">
                                        适用平台：Windows
                                    </el-tag>
                                    <el-tag size="large" round v-if="item.platform.linux">
                                        适用平台：Linux
                                    </el-tag>
                                    <el-tag size="large" round v-if="item.platform.macos">
                                        适用平台：MacOS
                                    </el-tag>
                                </el-space>
                                <el-space wrap>
                                    <el-button :disabled="item.file_url == ''" dark round type="success"
                                               @click="jumpToUrl(item.file_url)">
                                        {{ item.file_url == '' ? '暂无镜像下载地址' : '镜像下载' }}
                                    </el-button>
                                    <el-button :disabled="item.official_uri == ''" dark round type="primary"
                                               @click="jumpToUrl(item.official_uri)">
                                        {{ item.official_uri == '' ? '暂无官方下载地址' : '官方下载' }}
                                    </el-button>
                                </el-space>
                            </el-space>
                        </template>
                    </el-card>
                </el-col>
            </el-row>
            <el-empty v-else description="看起来这里并没有可以下载的软件"/>
        </div>
    </div>
</template>

<style scoped lang="scss">
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex-grow: 1;
    width: 100%;

    p {
        font-size: 1.05rem;
        line-height: 1.75;
    }

    .title {
        font-size: 2.5rem;
        font-weight: 600;
        color: $color-primary;
        margin-bottom: 40px;
    }

    .content {
        display: flex;
        flex-direction: column;
        width: 80%;

        > * {
            margin: 5px 0;
        }
    }
}
</style>