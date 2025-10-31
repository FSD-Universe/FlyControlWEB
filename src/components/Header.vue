<script setup lang="ts">
import config, {homeConfig} from "@/config/index.js";
import {Moon, Sunny} from "@element-plus/icons-vue";
import {useStateStore} from "@/store/state.js";
import PersonCard from "@/components/card/PersonCard.vue";
import {useUserStore} from "@/store/user.js";
import {useRouter} from "vue-router";
import {onMounted, ref} from "vue";

const stateStore = useStateStore();
const userStore = useUserStore();
const router = useRouter();

const mql = window.matchMedia("(max-width: 850px)");

const menuEllipsis = ref(false);

mql.onchange = (e) => {
    menuEllipsis.value = e.matches;
}

onMounted(() => {
    menuEllipsis.value = window.innerWidth <= 850;
})
</script>

<template>
    <div class="flex align-items-center header">
        <el-menu mode="horizontal" class="w-full" :ellipsis="menuEllipsis" :router="true">
            <el-menu-item>
                <img :src="config.icon_path" alt="Icon"/>
            </el-menu-item>
            <el-menu-item index="/">
                主页
            </el-menu-item>
            <el-sub-menu index="1">
                <template #title>关于我们</template>
                <el-menu-item index="/social">
                    官方社媒
                </el-menu-item>
                <el-menu-item index="/meeting">
                    会议记录
                </el-menu-item>
                <el-menu-item index="/staff">
                    职员
                </el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="/tools">
                <template #title>实用工具</template>
                <el-menu-item>
                    <a :href="homeConfig.content.eaip_mirror_url" target="_blank">中国EAIP镜像站</a>
                </el-menu-item>
<!--                <el-menu-item>-->
<!--                    <a :href="homeConfig.content.chart_mirror_url" target="_blank">航图查询</a>-->
<!--                </el-menu-item>-->
                <el-menu-item index="/metar">
                    气象报文查询
                </el-menu-item>
                <el-menu-item index="/software">
                    软件下载
                </el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="/controllers">
                <template #title>管制员</template>
                <el-menu-item index="/application">
                    成为管制员
                </el-menu-item>
                <el-menu-item index="/ratings">
                    管制员权限公示
                </el-menu-item>
            </el-sub-menu>
            <el-space wrap>
                <el-menu-item class="operations no-hover" v-if="homeConfig.content.qq_join_link != ''">
                    <a :href="homeConfig.content.qq_join_link" target="_blank">
                        <el-icon :size="32">
                            <svg width="1.2em" height="1.2em" viewBox="0 0 1024 1024">
                                <path fill="currentColor"
                                      d="M511.1 65.2c-247.4 0-448 200.6-448 448s200.6 448 448 448 448-200.6 448-448-200.6-448-448-448z m195.1 555.4s-14 38.2-39.5 72.4c0 0 45.7 15.5 41.8 56 0 0 1.5 45.2-97.6 42 0 0-69.7-5.5-90.6-35h-18.5c-20.9 29.6-90.6 35-90.6 35-99.1 3.1-97.6-42-97.6-42-3.9-40.4 41.8-56 41.8-56-25.5-34.2-39.5-72.4-39.5-72.4-61.9 100.4-55.7-14-55.7-14 11.7-67.7 60.4-112.1 60.4-112.1-7-61.6 18.5-72.4 18.5-72.4 5.4-190.2 168.4-186.9 171.9-186.8 3.4-0.1 166.5-3.4 171.9 186.8 0 0 25.5 10.9 18.5 72.4 0 0 48.7 44.3 60.4 112 0.2 0.1 6.3 114.5-55.6 14.1z"
                                />
                            </svg>
                        </el-icon>
                    </a>
                </el-menu-item>
                <el-menu-item class="operations no-hover" v-if="homeConfig.content.github != ''">
                    <a :href="homeConfig.content.github" target="_blank">
                        <el-icon :size="32">
                            <svg width="1.2em" height="1.2em" viewBox="0 0 24 24">
                                <path fill="currentColor"
                                      d="M12 2C6.475 2 2 6.475 2 12a9.994 9.994 0 0 0 6.838 9.488c.5.087.687-.213.687-.476c0-.237-.013-1.024-.013-1.862c-2.512.463-3.162-.612-3.362-1.175c-.113-.288-.6-1.175-1.025-1.413c-.35-.187-.85-.65-.013-.662c.788-.013 1.35.725 1.538 1.025c.9 1.512 2.338 1.087 2.912.825c.088-.65.35-1.087.638-1.337c-2.225-.25-4.55-1.113-4.55-4.938c0-1.088.387-1.987 1.025-2.688c-.1-.25-.45-1.275.1-2.65c0 0 .837-.262 2.75 1.026a9.28 9.28 0 0 1 2.5-.338c.85 0 1.7.112 2.5.337c1.912-1.3 2.75-1.024 2.75-1.024c.55 1.375.2 2.4.1 2.65c.637.7 1.025 1.587 1.025 2.687c0 3.838-2.337 4.688-4.562 4.938c.362.312.675.912.675 1.85c0 1.337-.013 2.412-.013 2.75c0 .262.188.574.688.474A10.016 10.016 0 0 0 22 12c0-5.525-4.475-10-10-10z"
                                />
                            </svg>
                        </el-icon>
                    </a>
                </el-menu-item>
                <el-menu-item class="operations no-hover">
                    <el-switch v-model="stateStore.isDark" @change="stateStore.toggleDark" :inactive-action-icon="Sunny"
                               :active-action-icon="Moon" size="large"/>
                </el-menu-item>
                <el-menu-item class="no-hover">
                    <PersonCard :expend="false" style="cursor: pointer;" v-if="userStore.isLogin"
                                @click.stop.prevent="router.push('/profile')"/>
                    <el-space v-else>
                        <el-button type="primary" @click="router.push('/register')">注册</el-button>
                        <el-button type="success" @click="router.push('/login')">登录</el-button>
                    </el-space>
                </el-menu-item>
            </el-space>
        </el-menu>
    </div>
</template>

<style scoped>
img {
    height: 40px;
}

.el-icon, svg, a {
    transition: none;
}

a {
    text-decoration: none;
    color: inherit;
}

.no-hover {
    cursor: default;
    --el-menu-hover-bg-color: none;
}

.operations {
    display: flex;
    flex-direction: row;
    padding: 0 5px;
}

.el-menu--horizontal > *:nth-child(5) {
    margin-right: auto;
}
</style>