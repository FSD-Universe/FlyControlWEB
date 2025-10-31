<script setup lang="ts">
import {homeConfig} from "@/config/index.js";
</script>

<template>
    <div class="container">
        <span class="title">会议记录</span>
        <el-table :data="homeConfig.meetings">
            <el-table-column label="文件名" prop="name"/>
            <el-table-column label="详细内容">
                <template #default="scope">
                    <el-link :href="scope.row.file_url" target="_blank">
                        {{ scope.row.file_display_name }}
                    </el-link>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<style scoped lang="scss">
.container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex: 1;
    width: 100%;

    .title {
        font-size: 2.5rem;
        font-weight: 600;
        color: $color-primary;
        margin-bottom: 40px;
    }

    .el-table {
        width: 60%;
        font-size: large;
    }
}

@media (max-width: 1000px) {
    .container {
        .el-table {
            width: 100%;
        }
    }
}
</style>