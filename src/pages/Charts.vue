<script setup lang="ts">
import {Search} from "@element-plus/icons-vue";
import {useActivityStore} from "@/store/activity.js";
import {onUnmounted, ref} from "vue";
import {FormItemInstance} from "element-plus";
import Api from "@/api/utils.js";
import getAirportChartsIndex = Api.getAirportChartsIndex;
import sendProxyRequest = Api.sendProxyRequest;
import {useStateStore} from "@/store/state.js";
import {showError} from "@/utils/message.js";
import {useReactiveWidth} from "@/composables/useReactiveWidth.js";

type AirportCharts = {
    star: AirportChartIndex[];
    app: AirportChartIndex[];
    taxi: AirportChartIndex[];
    sid: AirportChartIndex[];
    ref: AirportChartIndex[];
}

const activityStore = useActivityStore();
const stateStore = useStateStore();

const airportICAO = ref("");
const airportItem = ref<FormItemInstance>();

const airportCharts = ref<AirportCharts>({star: [], app: [], taxi: [], sid: [], ref: []});
const airportLoading = ref(false);

const clearAirportCharts = () => {
    const releaseSource = (chart: AirportChartIndex) => {
        if (chart.local_url) {
            URL.revokeObjectURL(chart.local_url);
        }
    }

    airportCharts.value.star.forEach(releaseSource);
    airportCharts.value.app.forEach(releaseSource);
    airportCharts.value.taxi.forEach(releaseSource);
    airportCharts.value.sid.forEach(releaseSource);
    airportCharts.value.ref.forEach(releaseSource);

    airportCharts.value = {star: [], app: [], taxi: [], sid: [], ref: []};
}

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
    try {
        airportLoading.value = true;
        const response = await getAirportChartsIndex(airportICAO.value);
        clearAirportCharts();
        response.charts.forEach(chart => {
            switch (chart.category) {
                case "REF":
                    airportCharts.value.ref.push(chart);
                    break;
                case "DEP":
                    airportCharts.value.sid.push(chart);
                    break;
                case "APP":
                    airportCharts.value.app.push(chart);
                    break;
                case "APT":
                    airportCharts.value.taxi.push(chart);
                    break;
                case "ARR":
                    airportCharts.value.star.push(chart);
                    break;
            }
        })
    } finally {
        airportLoading.value = false;
    }
};

const activeName = ref('STAR')
const imageUrl = ref("");
const loading = ref(false);
const srcList = ref([]);

const showCharts = async (charts: AirportChartIndex) => {
    if (charts.local_url && charts.dark_mode == stateStore.isDark) {
        imageUrl.value = charts.local_url;
        srcList.value = [charts.local_url];
        return;
    }
    loading.value = true;
    let url: string;
    if (stateStore.isDark) {
        url = charts.image_night_url;
    } else {
        url = charts.image_day_url;
    }
    try {
        const data = await sendProxyRequest(url, true);
        charts.local_url = URL.createObjectURL(data);
        charts.dark_mode = stateStore.isDark;
        imageUrl.value = charts.local_url;
        srcList.value = [charts.local_url];
    } finally {
        loading.value = false;
    }
}

onUnmounted(() => {
    clearAirportCharts();
})

const {less1000px} = useReactiveWidth();
</script>

<template>
    <el-card class="no-transform" style="min-height: 500px;">
        <template #header>
            <el-space wrap>
                <span>航图查询</span>
                <el-form-item ref="airportItem" class="search-bar">
                    <el-space wrap>
                        <el-autocomplete v-model="airportICAO" placeholder="请输入机场ICAO码"
                                         :fetch-suggestions="activityStore.queryAirports"
                                         @select="airport => handleDepartureSelect(airport)"
                                         clearable :disabled="airportLoading"/>
                        <el-button :icon="Search" type="primary" @click="queryICAOMeter" :loading="airportLoading"
                                   :disabled="airportLoading">
                            查询
                        </el-button>
                    </el-space>
                </el-form-item>
            </el-space>
        </template>
        <el-splitter :layout="less1000px ? 'vertical' : 'horizontal'" style="min-height: 500px;">
            <el-splitter-panel size="350">
                <el-tabs v-model="activeName" type="card">
                    <el-tab-pane label="STAR" name="STAR">
                        <el-space direction="vertical" alignment="normal" fill class="w-full">
                            <el-button class="procedure-card" type="primary" v-for="item in airportCharts.star"
                                       @click="showCharts(item)" :loading="loading" :disabled="loading">
                                <el-space direction="vertical" style="align-items: flex-start !important;">
                                    <span>{{ item.name }}</span>
                                    <span>{{ item.index_number }}</span>
                                </el-space>
                            </el-button>
                        </el-space>
                    </el-tab-pane>
                    <el-tab-pane label="APP" name="APP">
                        <el-space direction="vertical" alignment="normal" class="w-full">
                            <el-button class="procedure-card" type="primary" v-for="item in airportCharts.app"
                                       @click="showCharts(item)" :loading="loading" :disabled="loading">
                                <el-space direction="vertical" style="align-items: flex-start !important;">
                                    <span>{{ item.name }}</span>
                                    <span>{{ item.index_number }}</span>
                                </el-space>
                            </el-button>
                        </el-space>
                    </el-tab-pane>
                    <el-tab-pane label="TAXI" name="TAXI">
                        <el-space direction="vertical" alignment="normal" class="w-full">
                            <el-button class="procedure-card" type="primary" v-for="item in airportCharts.taxi"
                                       @click="showCharts(item)" :loading="loading" :disabled="loading">
                                <el-space direction="vertical" style="align-items: flex-start !important;">
                                    <span>{{ item.name }}</span>
                                    <span>{{ item.index_number }}</span>
                                </el-space>
                            </el-button>
                        </el-space>
                    </el-tab-pane>
                    <el-tab-pane label="SID" name="SID">
                        <el-space direction="vertical" alignment="normal" class="w-full">
                            <el-button class="procedure-card" type="primary" v-for="item in airportCharts.sid"
                                       @click="showCharts(item)" :loading="loading" :disabled="loading">
                                <el-space direction="vertical" style="align-items: flex-start !important;">
                                    <span>{{ item.name }}</span>
                                    <span>{{ item.index_number }}</span>
                                </el-space>
                            </el-button>
                        </el-space>
                    </el-tab-pane>
                    <el-tab-pane label="REF" name="REF">
                        <el-space direction="vertical" alignment="normal" class="w-full">
                            <el-button class="procedure-card" type="primary" v-for="item in airportCharts.ref"
                                       @click="showCharts(item)" :loading="loading" :disabled="loading">
                                <el-space direction="vertical" style="align-items: flex-start !important;">
                                    <span>{{ item.name }}</span>
                                    <span>{{ item.index_number }}</span>
                                </el-space>
                            </el-button>
                        </el-space>
                    </el-tab-pane>
                </el-tabs>
            </el-splitter-panel>
            <el-splitter-panel size="60%">
                <el-empty v-if="imageUrl == ''" description="暂无选定的航图"/>
                <el-image v-else :src="imageUrl" :preview-src-list="srcList" fit="fill"/>
            </el-splitter-panel>
        </el-splitter>
    </el-card>
</template>

<style scoped>
.procedure-card {
    height: auto;
    justify-content: flex-start;
    border-radius: 10px;
    margin-right: 10px
}

.search-bar {
    margin: 0;
}
</style>