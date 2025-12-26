<script setup lang="ts">
import {FormInstance, FormRules} from "element-plus";
import {CircleCheck, CircleClose, Clock, EditPen, List} from "@element-plus/icons-vue";
import {computed, onMounted, onUnmounted, ref, Ref} from "vue";
import {useRouter} from "vue-router";

import ApiController from "@/api/controller.js";
import ApplicationDescription from "@/components/ApplicationDescription.vue";
import type {ConfirmDialogInstance} from "@/components/dialog/ConfirmDialog.js";
import ConfirmDialog from "@/components/dialog/ConfirmDialog.vue";
import type {FormDialogInstance} from "@/components/dialog/FormDialog.js";
import FormDialog from "@/components/dialog/FormDialog.vue";
import type {ImageUploadInterface} from "@/components/ImageUpload.js";
import ImageUpload from "@/components/ImageUpload.vue";
import {ApplicationStatus, Global, Ratings} from "@/global.js";
import {useUserStore} from "@/store/user.js";
import {showError, showInfo, showSuccess} from "@/utils/message.js";
import {useReactiveWidth} from "@/composables/useReactiveWidth.js";
import config from "@/config/index.js";

const userStore = useUserStore();
const router = useRouter();

const application: Ref<Nullable<ControllerApplicationModel>> = ref(null);
const processStatus = ref(0);

enum ApplicationProgress {
    Submitted = 1,
    Processing,
    Waiting,
    Result
}

const getSelfApplication = async () => {
    const data = await ApiController.getSelfApplication();
    if (data != null) {
        application.value = data;
        if (data.status == ApplicationStatus.Submitted) {
            processStatus.value = ApplicationProgress.Submitted;
        }
        if (data.status == ApplicationStatus.Processing) {
            processStatus.value = ApplicationProgress.Waiting;
        }
        if (data.status >= ApplicationStatus.Passed) {
            processStatus.value = ApplicationProgress.Result;
        }
    }
}

let timeoutHandler: Nullable<number> = null;
const showCloseDialog = ref(!config.application)

onMounted(async () => {
    if (!config.application) {
        return;
    }
    if (userStore.userData.rating >= Ratings.Observer) {
        showInfo("你已是管制员，正在跳转至管制员档案");
        timeoutHandler = setTimeout(async () => await router.push("/controllers/profile"), 3000);
        return;
    }
    await getSelfApplication();
})

onUnmounted(() => {
    if (timeoutHandler) {
        clearTimeout(timeoutHandler);
        timeoutHandler = null;
    }
})

const applicationDialogRef: Ref<FormDialogInstance> = ref()
const applicationFormData = ref<ApplicationData>({
    why_want_to_be_controller: "",
    controller_record: "",
    is_guest: false,
    platform: "",
    evidence: ""
});
const applicationFormRef: Ref<FormInstance> = ref();
const applicationFormRule: Ref<FormRules> = ref({
    why_want_to_be_controller: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    controller_record: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    is_guest: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    platform: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ]
});
const imageUploadRef: Ref<ImageUploadInterface> = ref();
const submitApplicationLoading = ref(false);
const haveEnoughFlightTime = computed(() => {
    return userStore.userData.total_pilot_time >= 30 * 3600;
})

const openApplicationDialog = () => {
    if (!haveEnoughFlightTime.value) {
        showError("您的联飞时长不足，申请管制员需要至少30小时的连线飞行时间");
        return;
    }
    application.value = null;
    applicationDialogRef.value?.show();
}

const submitControllerApplication = async () => {
    submitApplicationLoading.value = true;
    try {
        await applicationFormRef.value.validate();
    } catch {
        submitApplicationLoading.value = false;
        return;
    }
    if (applicationFormData.value.is_guest) {
        if (imageUploadRef.value?.hasImageSelected()) {
            const imageUrl = await imageUploadRef.value?.upload();
            if (imageUrl == null) {
                submitApplicationLoading.value = false;
                return;
            }
            applicationFormData.value.evidence = imageUrl;
        } else {
            showError("缺少佐证材料");
            submitApplicationLoading.value = false;
            return;
        }
    }
    if (await ApiController.submitApplication(applicationFormData.value)) {
        showSuccess("提交管制员申请成功");
        applicationDialogRef.value?.hide();
        applicationFormData.value = {
            why_want_to_be_controller: "",
            controller_record: "",
            is_guest: false,
            platform: "",
            evidence: ""
        };
        await getSelfApplication();
    }
    submitApplicationLoading.value = false;
}

const confirmCancelDialogRef: Ref<ConfirmDialogInstance> = ref()
const cancelApplication = async () => {
    if (await ApiController.cancelApplication()) {
        showSuccess("成功取消管制员申请");
        application.value = null;
    }
}

const {less400px} = useReactiveWidth();
</script>

<template>
    <el-card class="no-transform">
        <template #header>
            管制员申请进度
        </template>
        <el-space wrap v-if="application != null" direction="vertical" :class="{'w-full': !less400px}" fill>
            <el-steps :active="processStatus" align-center class="w-full" v-if="!less400px">
                <el-step title="已提交申请, 等待审核" :icon="EditPen" status="success"/>
                <el-step title="空管中心已受理, 审核中" :icon="List"
                         :status="processStatus > ApplicationProgress.Processing ? 'success' : 'process'"/>
                <el-step title="等待结果" :icon="Clock"
                         :status="processStatus > ApplicationProgress.Waiting ? 'success' : 'process'"/>
                <el-step title="恭喜, 您的申请已通过" v-if="application?.status == ApplicationStatus.Passed"
                         :icon="CircleCheck" status="success"/>
                <el-step title="很遗憾, 您的申请未通过" v-if="application?.status == ApplicationStatus.Rejected"
                         :icon="CircleClose" status="error">
                    <template #description>
                        <el-button type="primary" round @click="openApplicationDialog()"
                                   :disabled="!config.application">
                            重新提交申请
                        </el-button>
                    </template>
                </el-step>
            </el-steps>
            <el-space :class="{'justify-content-center': !less400px}"
                      v-if="application?.status < ApplicationStatus.Passed">
                <el-button type="danger" round @click="confirmCancelDialogRef?.show()">取消申请</el-button>
                <el-button type="primary" round @click="openApplicationDialog()" :disabled="!config.application"
                           v-if="less400px && application?.status == ApplicationStatus.Rejected">
                    重新提交申请
                </el-button>
            </el-space>
            <ApplicationDescription :application="application"/>
        </el-space>
        <el-empty v-else description="看来你还没有提交过管制员申请">
            <el-button type="primary" @click="openApplicationDialog()" :disabled="!config.application">立刻提交
            </el-button>
        </el-empty>
    </el-card>
    <FormDialog ref="applicationDialogRef" title="提交管制员申请" :width="800"
                @dialog-confirm-event="submitControllerApplication()" :loading="submitApplicationLoading">
        <el-form :model="applicationFormData" :rules="applicationFormRule" ref="applicationFormRef"
                 label-position="top">
            <el-space fill class="w-full">
                <el-alert type="primary" :closable="false" show-icon>
                    <p>此回答没有标准答案</p>
                    <p>空管中心一般不会因此拒绝您的加入申请, 请放心填写</p>
                </el-alert>
                <el-form-item label="为什么想要成为管制员" prop="why_want_to_be_controller">
                    <el-input v-model="applicationFormData.why_want_to_be_controller"
                              placeholder="请简单描述一下你为什么想成为管制员"
                              type="textarea"
                              :autosize="{minRows: 3, maxRows: 10}"/>
                </el-form-item>
            </el-space>
            <el-form-item label="管制经历" prop="controller_record">
                <el-input v-model="applicationFormData.controller_record"
                          placeholder="请简单描述一下你的管制经历, 没有请写'无'"
                          type="textarea" :autosize="{minRows: 3, maxRows: 10}"/>
            </el-form-item>
            <el-form-item label="客座管制" label-position="left" prop="is_guest">
                <el-switch v-model="applicationFormData.is_guest"/>
            </el-form-item>
            <el-form-item label="客座平台" label-position="left" prop="platform" v-if="applicationFormData.is_guest">
                <el-select v-model="applicationFormData.platform" :options="Global.supportedPlatforms"/>
            </el-form-item>
            <el-space fill v-if="applicationFormData.is_guest">
                <el-alert type="warning" :closable="false" show-icon>
                    <p>只能上传一张图片, 请上传最明确的材料</p>
                    <p>比如说包含对应客座平台名字的权限公示表</p>
                </el-alert>
                <el-form-item label="佐证材料" label-position="left" required>
                    <ImageUpload ref="imageUploadRef" v-model="applicationFormData.evidence"/>
                </el-form-item>
            </el-space>
        </el-form>
    </FormDialog>
    <ConfirmDialog ref="confirmCancelDialogRef"
                   body-content="确认取消申请吗？"
                   header-content="取消管制员申请"
                   @confirm-event="cancelApplication"/>
    <el-dialog title="管制员申请通道暂时关闭"
               v-model="showCloseDialog"
               :close-on-press-escape="false"
               :close-on-click-modal="false"
               :show-close="false"
               :width="800">
        <div class="announcement">
            <span>由于新招收管制学员过多，管制员训练部暂时无法继续接受新管制员的申请与培训工作。</span>
            <span>即日起，暂时关闭管制员申请通道，下次开放时间请留意群内公告信息。</span>
        </div>
        <div class="announcement-footer">
            <el-button type="primary" @click="router.back()">关闭</el-button>
        </div>
    </el-dialog>
</template>

<style scoped>
.announcement {
    font-size: 1.1rem;
    line-height: 1.5;
    margin: 5px 0;
    display: flex;
    flex-direction: column;
}

.announcement-footer {
    display: flex;
    justify-content: flex-end;
}
</style>