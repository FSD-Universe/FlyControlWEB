<script setup lang="ts">
import {Search} from "@element-plus/icons-vue";
import {FormItemInstance} from "element-plus";
import {useActivityStore} from "@/store/activity.js";
import {ref} from "vue";
import Api from "@/api/utils.js";
import getMetar = Api.getMetar;

const activityStore = useActivityStore();

const airportICAO = ref("");
const airportItem = ref<FormItemInstance>();
const historyMeter = ref([])

const handleDepartureSelect = (airport: Airport) => {
    airportICAO.value = airport.icao;
    airportItem.value.validateState = "";
    airportItem.value.validateMessage = "";
}

const queryICAOMeter = async () => {
    airportItem.value.validateState = "";
    airportItem.value.validateMessage = "";
    if (airportICAO.value == "") {
        airportItem.value.validateState = "error";
        airportItem.value.validateMessage = "ICAO码不能为空";
    }
    if (airportICAO.value.length != 4) {
        airportItem.value.validateState = "error";
        airportItem.value.validateMessage = "ICAO码格式错误";
    }
    const response = await getMetar(airportICAO.value)
    if (response && response.length > 0) {
        historyMeter.value.push(...response);
    }
};
</script>

<template>
    <el-card class="no-transform">
        <template #header>
            <el-form-item label="气象报文查询" ref="airportItem" class="search-bar">
                <el-space>
                    <el-autocomplete v-model="airportICAO" placeholder="请输入机场ICAO码"
                                     :fetch-suggestions="activityStore.queryAirports"
                                     @select="airport => handleDepartureSelect(airport)"
                                     clearable/>
                    <el-button :icon="Search" type="primary" @click="queryICAOMeter">
                        查询
                    </el-button>
                </el-space>
            </el-form-item>
        </template>
        <el-empty v-if="historyMeter.length == 0" description="暂无查询历史记录"/>
        <el-space v-else direction="vertical" fill class="w-full">
            <span class="result" v-for="item in historyMeter">
                {{ item }}
            </span>
        </el-space>
    </el-card>
</template>

<style scoped>
.result {
    background-color: rgba(var(--el-color-success-rgb), 0.8);
    border-radius: 4px;
    padding: 5px 9px;
    font-size: 12px;
    color: var(--el-color-white);
    line-height: 1;
}

.search-bar {
    margin: 0;
}
</style>