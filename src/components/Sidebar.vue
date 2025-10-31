<script setup lang="ts">
import config from "@/config/index.js";
import {
    Calendar, Document,
    DocumentChecked,
    HomeFilled,
    MapLocation,
    Moon,
    Operation, Picture,
    Setting,
    Sunny,
    UserFilled
} from "@element-plus/icons-vue";
import PersonCard from "@/components/card/PersonCard.vue";
import {onMounted, ref} from "vue";
import {useUserStore} from "@/store/user.js";
import {PermissionNode} from "@/utils/permission.js";
import {useStateStore} from "@/store/state.js";
import {useRouter} from "vue-router";
import {Ratings} from "@/global.js";

const userStore = useUserStore();
const stateStore = useStateStore();
const router = useRouter();

const mql = window.matchMedia("(max-width: 1000px)");

const menuExpend = ref(false);

mql.onchange = (e) => {
    if (e.matches && menuExpend.value) {
        menuExpend.value = false;
    }
}

const open = ref(false);
const expendRef = ref()
const switchRef = ref()
const backRef = ref()

const closeCallback = () => {
    localStorage.setItem('tutorial', true)
}

onMounted(() => {
    if (localStorage.getItem("tutorial") == null) {
        open.value = true;
    }
})
</script>

<template>
    <el-tour v-model="open" type="primary" @close="closeCallback()">
        <el-tour-step title="飞控介绍">
            <div>欢迎新用户, 接下来我为将为你简单介绍</div>
        </el-tour-step>
        <el-tour-step :target="expendRef?.$el" title="飞控介绍" placement="right">
            <div>点击这里切换侧边栏的展开和收回</div>
        </el-tour-step>
        <el-tour-step :target="switchRef?.$el" title="飞控介绍" placement="right">
            <div>点击这里切换日夜模式</div>
        </el-tour-step>
        <el-tour-step :target="backRef?.$el" title="飞控介绍" placement="right">
            <div>点击这里返回到门户网页(请不要现在点击)</div>
        </el-tour-step>
    </el-tour>
    <el-menu default-active="2"
             class="menu"
             :collapse="!menuExpend"
             :close-on-click-outside="true"
             :unique-opened="true"
             popper-class="popper"
             :router="true">
        <el-menu-item
            ref="expendRef"
            style="color: var(--el-menu-text-color); user-select: none; padding-left: 6px"
            @click="menuExpend=!menuExpend">
            <div class="flex align-items-center">
                <img class="margin-left-5 margin-right-5" :src="config.icon_path" alt="Icon"/>
                <div class="title padding-left-5 padding-right-5" v-if="menuExpend">
                    {{ config.title }}
                </div>
            </div>
        </el-menu-item>
        <el-menu-item index="/home">
            <el-icon>
                <HomeFilled/>
            </el-icon>
            <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/activities">
            <el-icon>
                <Calendar/>
            </el-icon>
            <span>连飞活动</span>
        </el-menu-item>
        <el-menu-item index="/online-map">
            <el-icon>
                <MapLocation/>
            </el-icon>
            <span>在线地图</span>
        </el-menu-item>
        <el-menu-item index="/charts">
            <el-icon>
                <Picture/>
            </el-icon>
            <span>航图查询</span>
        </el-menu-item>
        <el-menu-item index="/weather">
            <el-icon>
                <Sunny/>
            </el-icon>
            <span>气象报文查询</span>
        </el-menu-item>
        <el-menu-item index="/ticket">
            <el-icon>
                <DocumentChecked/>
            </el-icon>
            <span>投诉与反馈中心</span>
        </el-menu-item>
        <el-menu-item index="/flight-plan">
            <el-icon>
                <Document/>
            </el-icon>
            <span>提交飞行计划</span>
        </el-menu-item>
        <el-sub-menu index="/controllers">
            <template #title>
                <el-icon>
                    <Operation/>
                </el-icon>
                <span>管制员中心</span>
            </template>
            <el-menu-item index="/controllers/application">
                管制员申请
            </el-menu-item>
            <el-menu-item index="/controllers/activity" v-if="userStore.userData.rating >= Ratings.Observer">
                活动登记
            </el-menu-item>
            <el-menu-item index="/controllers/profile" v-if="userStore.userData.rating >= Ratings.Observer">
                管制员档案
            </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="/admin" v-if="userStore.permission?.hasPermissionNode(PermissionNode.AdminEntry)">
            <template #title>
                <el-icon>
                    <Setting/>
                </el-icon>
                <span>管理员中心</span>
            </template>
            <el-menu-item index="/admin/users"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.UserShowList)">
                用户管理
            </el-menu-item>
            <el-menu-item index="/admin/controllers"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.ControllerShowList)">
                管制员管理
            </el-menu-item>
            <el-menu-item index="/admin/applications"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.ControllerApplicationShowList)">
                管制员申请管理
            </el-menu-item>
            <el-menu-item index="/admin/activities"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.ActivityShowList)">
                活动管理
            </el-menu-item>
            <el-menu-item index="/admin/flight-plan"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.FlightPlanShowList)">
                飞行计划管理
            </el-menu-item>
            <el-menu-item index="/admin/announcements"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.AnnouncementShowList)">
                公告管理
            </el-menu-item>
            <el-menu-item index="/admin/clients"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.ClientManagerEntry)">
                在线管理
            </el-menu-item>
            <el-menu-item index="/admin/tickets"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.TicketShowList)">
                工单管理
            </el-menu-item>
            <el-menu-item index="/admin/permissions"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.UserShowPermission)">
                权限管理
            </el-menu-item>
            <el-menu-item index="/admin/audit"
                          v-if="userStore.permission?.hasPermissionNode(PermissionNode.AuditLogShow)">
                审计日志
            </el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/profile">
            <el-icon>
                <UserFilled/>
            </el-icon>
            <span>个人中心</span>
        </el-menu-item>
    </el-menu>
    <div class="person">
        <el-switch v-model="stateStore.isDark" @change="stateStore.toggleDark" :inactive-action-icon="Sunny"
                   :active-action-icon="Moon" ref="switchRef"/>
        <PersonCard :expend="menuExpend" style="cursor: pointer;" @click="router.push('/')" ref="backRef"/>
    </div>
</template>

<style scoped>
.person {
    margin: 10px;
}

.el-menu,
.el-sub-menu,
.el-menu:deep(.el-menu),
.el-menu:deep(.el-menu-item) {
    border-right: none;
    background-color: transparent;
}

.menu {
    flex-grow: 1;
}

.header > * {
    padding: 0 5px;
}

.title {
    font-size: 1.3rem;
    font-weight: 200;
}

img {
    width: 40px;
    height: 40px;
}
</style>