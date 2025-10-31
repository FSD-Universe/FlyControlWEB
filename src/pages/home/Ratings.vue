<script setup lang="ts">
import moment from "moment";

import ApiController from "@/api/controller.js";
import type {PageListResponse} from "@/components/card/PageListCard.js";
import PageListCard from "@/components/card/PageListCard.vue";
import config from "@/config/index.js";
import {useServerConfigStore} from "@/store/server_config.js";
import {formatCid, handleImageUrl} from "@/utils/utils.js";
import {useReactiveWidth} from "@/composables/useReactiveWidth.js";

const serverConfigStore = useServerConfigStore();

const fetchRatingsData = async (page: number, pageSize: number): PageListResponse<ControllerRating> => {
    const result: PageListResponse<ControllerRating> = {data: [], total: 0}
    const data = await ApiController.getControllerRatings(page, pageSize);
    if (data != null) {
        result.data = data.items;
        result.total = data.total;
    }
    return result;
}

const {less900px, less500px} = useReactiveWidth();
</script>

<template>
    <div class="container">
        <p class="title">管制员权限公示</p>
        <div class="content">
            <p>下方表格的内容基于管制员中心数据自动生成，正常情况下最多存在24小时延迟</p>
            <p>表中数据仅包含至少含有一类席位管制权限的管制员（含客座管制员），即不包含在下表中的管制员不再拥有管制权限</p>
            <PageListCard :fetch-data="fetchRatingsData" card-title="管制员权限公示表">
                <el-table-column type="expand" v-if="less900px">
                    <template #default="scope">
                        <el-descriptions :column="1">
                            <el-descriptions-item label="管制等级" v-if="less500px">
                                <el-space wrap class="justify-content-center">
                                    <el-tag v-if="scope.row.tier2" type="success" effect="dark">Tier2</el-tag>
                                    <el-tag v-else type="danger" effect="dark">Tier2</el-tag>
                                    <el-tag class="level text-color-white border-none" effect="dark"
                                            :color="config.ratings[scope.row.rating + 1].color">
                                        {{ serverConfigStore.getRatingShortName(scope.row.rating) }}
                                    </el-tag>
                                </el-space>
                            </el-descriptions-item>
                            <el-descriptions-item label="客座管制" v-if="less900px">
                                <el-tag type="success" v-if="scope.row.is_guest">是</el-tag>
                                <el-tag type="danger" v-else>否</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="实习中" v-if="less900px">
                                <el-tag type="success" v-if="scope.row.under_monitor">是</el-tag>
                                <el-tag type="danger" v-else>否</el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item label="SOLO" v-if="less900px">
                                <el-tag type="success" v-if="scope.row.under_solo">
                                    {{ moment(scope.row.until_solo).format('YYYY-MM-DD HH:mm:ss') }}
                                </el-tag>
                                <el-tag type="danger" v-else>否</el-tag>
                            </el-descriptions-item>
                        </el-descriptions>
                    </template>
                </el-table-column>
                <el-table-column label="CID">
                    <template #default="scope">
                        <el-space>
                            <el-avatar v-if="scope.row.avatar_url == ''">{{ formatCid(scope.row.cid) }}</el-avatar>
                            <el-avatar v-else :src="handleImageUrl(scope.row.avatar_url)"></el-avatar>
                            <span style="font-size: 1.2rem;font-weight: 450;margin-left: 10px">
                                {{ formatCid(scope.row.cid) }}
                            </span>
                        </el-space>
                    </template>
                </el-table-column>
                <el-table-column label="管制等级" v-if="!less500px">
                    <template #default="scope">
                        <el-space wrap class="justify-content-center">
                            <el-tag v-if="scope.row.tier2" type="success" effect="dark">Tier2</el-tag>
                            <el-tag v-else type="danger" effect="dark">Tier2</el-tag>
                            <el-tag class="level text-color-white border-none" effect="dark"
                                    :color="config.ratings[scope.row.rating + 1].color">
                                {{ serverConfigStore.getRatingShortName(scope.row.rating) }}
                            </el-tag>
                        </el-space>
                    </template>
                </el-table-column>
                <el-table-column label="客座管制" v-if="!less900px">
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.is_guest">是</el-tag>
                        <el-tag type="danger" v-else>否</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="实习中" v-if="!less900px">
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.under_monitor">是</el-tag>
                        <el-tag type="danger" v-else>否</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="SOLO" v-if="!less900px">
                    <template #default="scope">
                        <el-tag type="success" v-if="scope.row.under_solo">
                            {{ moment(scope.row.until_solo).format('YYYY-MM-DD HH:mm:ss') }}
                        </el-tag>
                        <el-tag type="danger" v-else>否</el-tag>
                    </template>
                </el-table-column>
            </PageListCard>
        </div>
    </div>
</template>

<style scoped lang="scss">
.container {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    .el-card {
        transform: none;
    }

    p {
        font-size: 1.05rem;
        line-height: 1.75;
    }

    .content {
        width: 80%;
    }

    .title {
        font-size: 2.5rem;
        font-weight: 600;
        color: $color-primary;
        margin-bottom: 40px;
    }
}

@media (max-width: 550px) {
    .container {
        text-align: center;
    }
}


@media (max-width: 375px) {
    .container {
        .title {
            font-size: 2rem;
        }
    }
}
</style>