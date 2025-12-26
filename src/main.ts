import {createApp} from 'vue'
import App from './App.vue'
import router from "@/router/index.js";

import Clarity from '@microsoft/clarity';
import Toast, {PluginOptions} from "vue-toastification";
import "vue-toastification/dist/index.css";
import 'element-plus/theme-chalk/dark/css-vars.css'
import pinia from "@/store/index.js";

import "@/assets/css/style.scss"
import "@/assets/css/dark.scss"
import "@/assets/css/define.scss"
import "@/assets/css/media.scss"
import {useUserStore} from "@/store/user.js";
import {useServerConfigStore} from "@/store/server_config.js";
import {useStateStore} from "@/store/state.js";
import config from "@/config/index.js";
import {formatCid} from "@/utils/utils.js";

const app = createApp(App);

const options: PluginOptions = {};

// @ts-ignore
app.use(Toast, options);
app.use(pinia);
app.use(router);

Clarity.init(config.project_id);
useStateStore();
useServerConfigStore().getConfigFromServer().catch();
const userStore = useUserStore();
userStore.initUser().finally(() => {
    if (userStore.isLogin) {
        Clarity.identify(`${userStore.userData.id}(${formatCid(userStore.userData.cid)})`)
    }
    app.mount('#app')
});