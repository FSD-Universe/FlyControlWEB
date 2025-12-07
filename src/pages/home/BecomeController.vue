<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";

import {homeConfig} from "@/config/index.js";

const checkedList = ref([]);
const router = useRouter();
</script>

<template>
    <div class="container">
        <span class="title">成为管制员</span>
        <p>{{ homeConfig.title }}欢迎各位其他平台的管制员来到本平台</p>
        <p>无论是观摩学习还是莅临指导，平台的大门永远向你们打开。</p>
        <div class="content">
            <span class="second-title">如何申请管制员？</span>
            <el-checkbox-group v-model="checkedList" size="large" class="flex flex-direction-column">
                <el-checkbox label="拥有对管制工作的热爱" value="1"/>
                <el-checkbox label="注册满48小时" value="2"/>
                <el-checkbox label="机组的中英文陆空能力" value="3"/>
                <el-checkbox label="了解管制员的规章制度" value="4"/>
                <el-checkbox label="简单的Metar报文解读能力" value="5"/>
                <el-checkbox label="eAIP航图识读能力" value="6"/>
                <el-checkbox label="了解RVSM高度层" value="7"/>
                <el-checkbox label="了解飞行情报区及空域的运行规范" value="8"/>
                <el-checkbox label="拥有至少30小时的连线飞行时间" value="9"/>
            </el-checkbox-group>
            <el-button type="primary" round dark size="large" :disabled="checkedList.length != 9"
                       @click="router.push('/controllers/application')">
                立刻申请
            </el-button>
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

    .second-title {
        font-size: 1.8rem;
        font-weight: 600;
        color: $color-primary;
        margin: 30px 0;
        border-left: 5px solid $color-primary;
        padding-left: 10px;
    }

    .content {
        display: flex;
        flex-direction: column;
        width: 50%;
        margin: 20px 0;

        > * {
            margin: 5px 0;
        }
    }
}

@media (max-width: 1000px) {
    .container {
        .content {
            width: 100%;
        }
    }
}
</style>