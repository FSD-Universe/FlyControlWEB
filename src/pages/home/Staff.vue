<script setup lang="ts">
import {onMounted} from "vue";

import StaffList from "@/components/home/StaffList.vue";
import {homeConfig} from "@/config/index.js";

const setData = (job: Job) => {
    const data = homeConfig.staff.staffers[job.qq];
    if (data) {
        job.nickname = data.nickname;
        job.email = data.email;
        job.description = data.description != "" ? data.description : "暂无";
    } else {
        job.nickname = "空缺";
        job.email = "空缺";
        job.description = "暂无";
    }
}

onMounted(() => {
    homeConfig.staff.officer.forEach(setData);
    homeConfig.staff.technical_department.forEach(setData);
    homeConfig.staff.train_department.train.forEach(setData);
    homeConfig.staff.train_department.sector.forEach(setData);
    homeConfig.staff.activity_department.forEach(setData);
})
</script>

<template>
    <div class="container">
        <span class="title">职员</span>
        <div class="content">
            <p>
                以下是{{ homeConfig.title }}的职员列表，您可以通过添加职员的QQ或电子邮箱联系他们。
                <br/>
                注：电子邮件请使用邮件的标准格式。
            </p>
            <span class="second-title">管理组</span>
            <p>
                管理组主要负责决策、管理、统筹、规划等工作。
                <br/>
                注：当部门成员离职或空缺时，上方主管接任
            </p>
            <StaffList :data="homeConfig.staff.officer"/>
            <span class="second-title">部门职员</span>
            <p>部门职员主要负责执行、运作、实施等工作。</p>
            <span class="third-title">技术组 职员</span>
            <StaffList :data="homeConfig.staff.technical_department"/>
            <span class="third-title">空管中心 职员</span>
            <span class="fourth-title">培训部门</span>
            <StaffList :data="homeConfig.staff.train_department.train"/>
            <span class="fourth-title">扇区组</span>
            <StaffList :data="homeConfig.staff.train_department.sector"/>
            <span class="third-title">活动组织部门 职员</span>
            <StaffList :data="homeConfig.staff.activity_department"/>
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

    .content {
        display: flex;
        flex-direction: column;
        width: 80%;
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

    .third-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: $color-primary;
        margin: 20px 0;
    }

    .fourth-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: $color-primary;
        margin: 20px 0;
    }

    p {
        font-size: 1.05rem;
        line-height: 1.75;
    }
}

@media (max-width: 425px) {
    .container {
        .content {
            width: 100%;
        }
    }
}
</style>