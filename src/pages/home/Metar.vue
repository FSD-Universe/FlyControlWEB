<script setup lang="ts">
import {ref} from "vue";

import Api from "@/api/utils.js";
import {showSuccess, showWarning} from "@/utils/message.js";

const icao = ref("");
const metarRawData = ref([]);

const queryMetar = async () => {
    metarRawData.value = "";
    const data = await Api.getMetar(icao.value);
    if (data != null) {
        showSuccess("Metar查询成功");
        metarRawData.value = data;
        return
    }
    showWarning("未查询到指定机场报文");
}
</script>

<template>
    <div class="container">
        <span class="title">Metar查询</span>
        <p class="display-over-450px">
            部分Metar数据来自
            <el-link href="https://aviationweather.gov/data/metar/" target="_blank">
                https://aviationweather.gov/data/metar/
            </el-link>
        </p>
        <div class="content">
            <div class="flex flex-direction-column">
                <el-space wrap fill>
                    <el-alert type="primary" :closable="false">
                        <div class="flex flex-direction-column">
                            <span>支持多机场查询</span>
                            <span>机场与机场间使用','分隔</span>
                            <span>中间不能有空格</span>
                            <span>例如：ZSSS,ZGHA,ZBAA</span>
                        </div>
                    </el-alert>
                    <el-input v-model="icao" placeholder="请输入机场ICAO码">
                        <template #append>
                            <el-button @click="queryMetar()">查询</el-button>
                        </template>
                    </el-input>
                </el-space>
            </div>
            <span class="result" v-for="item in metarRawData">
                {{ item }}
            </span>
        </div>
    </div>
</template>

<style scoped lang="scss">
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
    flex: 1;

    p {
        font-size: 1.05rem;
        line-height: 1.75;
    }

    .result {
        background-color: rgba(var(--el-color-success-rgb), 0.8);
        border-radius: 4px;
        padding: 5px 9px;
        font-size: 12px;
        color: var(--el-color-white);
        line-height: 1;
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
        width: 40%;

        > * {
            margin: 5px 0;
        }
    }
}

@media (max-width: 1000px) {
    .container {
        .content {
            width: 60%;
        }
    }
}

@media (max-width: 600px) {
    .container {
        .content {
            width: 100%;
        }
    }
}
</style>