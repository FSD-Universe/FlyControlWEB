<script setup lang="ts">
import axios from "axios";
import {FormInstance, FormItemInstance, FormRules} from "element-plus";
import {Check, Delete, Download, Share} from "@element-plus/icons-vue";
import {cloneDeep, join} from "lodash";
import {padStart} from "lodash-es";
import moment from "moment";
import {onMounted, Ref, ref} from "vue";
import {useClipboard, useStorage} from "@vueuse/core";
import {useRoute} from "vue-router";

import ApiFlightPlan from "@/api/flightplan.js";
import type {ConfirmDialogInstance} from "@/components/dialog/ConfirmDialog.js";
import ConfirmDialog from "@/components/dialog/ConfirmDialog.vue";
import type {FormDialogInstance} from "@/components/dialog/FormDialog.js";
import FormDialog from "@/components/dialog/FormDialog.vue";
import {useActivityStore} from "@/store/activity.js";
import {showError, showSuccess, showWarning} from "@/utils/message.js";

import AxiosXHR = Axios.AxiosXHR;

const route = useRoute();

const activityStore = useActivityStore();

const flightRule = [{label: 'IFR(仪表飞行)', value: 'I'}, {label: 'VFR(目视飞行)', value: 'F'}]
const wakeCategory = [
    {label: "轻型机(MTOW <= 7000kg)", value: "L"},
    {label: "中型机(MTOW <= 136000kg)", value: "M"},
    {label: "重型机", value: "H"},
    {label: "超重型机(A388)", value: "J"}
]

const voiceType = [
    {label: '双向语音', value: '/V/'},
    {label: '仅接收语音', value: '/R/'},
    {label: '仅文字', value: '/T/'}
]

enum RemarkSign {
    PBN = "PBN",
    NAV = "NAV",
    DAT = "DAT",
    SUR = "SUR",
    DOF = "DOF",
    REG = "REG",
    SEL = "SEL",
    CODE = "CODE",
    RVR = "RVR",
    OPR = "OPR",
    PER = "PER",
    RALT = "RALT",
    TALT = "TALT",
    ORGN = "ORGN",
    COM = "COM",
    EET = "EET",
    RMK = "RMK"
}

type FlightPlanData = {
    callsign: string;
    flight_rule: string;
    flight_type: string;
    wake_category: string;
    equipment_code: string;
    transponder_code: string;
    departure: string;
    departure_time: Date;
    altitude: number;
    tas: number,
    arrival: string;
    alternate: string;
    air_time: Date;
    fuel_time: Date;
    route: string;
    pbn: string;
    nav: string;
    dat: string;
    sur: string;
    dof: Date;
    reg: string;
    sel: string;
    code: string;
    rvr: string;
    opr: string;
    per: string;
    ralt: string;
    talt: string;
    orgn: string;
    com: string;
    eet: string;
    rmk: string;
    voice: string;
}
const defaultFlightPlanData = {
    callsign: '',
    flight_rule: 'I',
    flight_type: '',
    wake_category: '',
    equipment_code: '',
    transponder_code: '',
    departure: '',
    departure_time: moment().toDate(),
    altitude: 0,
    tas: 0,
    arrival: '',
    alternate: '',
    air_time: moment({hour: 0, minute: 0}).toDate(),
    fuel_time: moment({hour: 0, minute: 0}).toDate(),
    route: '',
    code: "",
    com: "",
    dat: "",
    dof: moment().toDate(),
    eet: "",
    nav: "",
    opr: "",
    orgn: "",
    pbn: "",
    per: "",
    ralt: "",
    reg: "",
    rmk: "",
    rvr: "",
    sel: "",
    sur: "",
    talt: "",
    voice: "/V/"
}

const flightPlanFormData = ref<FlightPlanData>(defaultFlightPlanData);

const flightPlanFormRule: Ref<FormRules<FlightPlanData>> = ref({
    callsign: [
        {required: true, message: "此条目不能为空", trigger: "blur"},
        {min: 4, message: "呼号不能小于4个字符", trigger: "blur"}
    ],
    flight_type: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    wake_category: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    equipment_code: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    departure: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    altitude: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    tas: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    arrival: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ],
    route: [
        {required: true, message: "此条目不能为空", trigger: "blur"}
    ]
})

const parseAltitude = (altitude: string): number => {
    const num = parseInt(altitude);
    if (isNaN(num)) {
        return parseInt(altitude.substring(2)) * 100;
    }
    return num;
}

const encodeRemarks = (data: FlightPlanData): string => {
    const remarks: string[] = [];
    remarks.push(data.voice);
    remarks.push(`DOF/${moment(data.dof).format("YYMMDD")}`);

    if (data.pbn != "") {
        remarks.push(`PBN/${data.pbn}`);
    }

    if (data.nav != "") {
        remarks.push(`NAV/${data.nav}`);
    }

    if (data.dat != "") {
        remarks.push(`DAT/${data.dat}`);
    }

    if (data.sur != "") {
        remarks.push(`SUR/${data.sur}`);
    }

    if (data.reg != "") {
        remarks.push(`REG/${data.reg}`);
    }

    if (data.sel != "") {
        remarks.push(`SEL/${data.sel}`);
    }

    if (data.code != "") {
        remarks.push(`CODE/${data.code}`);
    }

    if (data.rvr != "") {
        remarks.push(`RVR/${data.rvr}`);
    }

    if (data.opr != "") {
        remarks.push(`OPR/${data.opr}`);
    }

    if (data.per != "") {
        remarks.push(`PER/${data.per}`);
    }

    if (data.ralt != "") {
        remarks.push(`RALT/${data.ralt}`);
    }

    if (data.talt != "") {
        remarks.push(`TALT/${data.talt}`);
    }

    if (data.orgn != "") {
        remarks.push(`ORGN/${data.orgn}`);
    }

    if (data.eet != "") {
        remarks.push(`EET/${data.eet}`);
    }

    if (data.rmk != "") {
        remarks.push(`RMK/${data.rmk}`);
    }

    return join(remarks, " ");
}

const encodeAircraftType = (data: FlightPlanData): string => {
    return `${data.flight_type}/${data.wake_category}-${data.equipment_code}/${data.transponder_code}`
}

const toFlightPlanModel = (data: FlightPlanData): FlightPlanModel => {
    const result: FlightPlanModel = {
        callsign: "",
        flight_rules: "",
        aircraft: "",
        departure: "",
        departure_time: 0,
        altitude: "",
        cruise_tas: 0,
        arrival: "",
        alternate: "",
        route_time_hour: "",
        route_time_minute: "",
        fuel_time_hour: "",
        fuel_time_minute: "",
        route: "",
        remarks: ""
    }
    result.callsign = data.callsign;
    result.flight_rules = data.flight_rule;
    result.aircraft = encodeAircraftType(data);
    result.departure = data.departure;
    result.departure_time = Number(moment(data.departure_time).utc().format('HHmm'));
    result.altitude = data.altitude.toString();
    result.cruise_tas = Number(data.tas);
    result.arrival = data.arrival;
    result.alternate = data.alternate;
    const air_time = moment(data.air_time).format('HH:mm');
    result.route_time_hour = air_time.split(':')[0];
    result.route_time_minute = air_time.split(':')[1];
    const fuel_time = moment(data.fuel_time).format('HH:mm');
    result.fuel_time_hour = fuel_time.split(':')[0];
    result.fuel_time_minute = fuel_time.split(':')[1];
    result.route = data.route;
    result.remarks = encodeRemarks(data).replace('\n', '');
    return result;
}

const decodeAircraftType = (aircraft: string, data: FlightPlanData) => {
    const temp = aircraft.split("-");
    if (temp.length > 0) {
        const d = temp[0].split("/");
        data.flight_type = d[0]
        if (d.length > 1) {
            data.wake_category = d[1];
        }
    }
    if (temp.length > 1) {
        const d = temp[1].split("/");
        if (d.length > 0) {
            data.equipment_code = d[0];
        }
        if (d.length > 1) {
            data.transponder_code = d[1];
        }
    }
}

const setTargetData = (data: FlightPlanData, target: string, d: string) => {
    switch (target) {
        case RemarkSign.PBN :
            data.pbn = d;
            break;
        case RemarkSign.NAV :
            data.nav = d;
            break;
        case RemarkSign.DAT :
            data.dat = d;
            break;
        case RemarkSign.SUR :
            data.sur = d;
            break;
        case RemarkSign.DOF :
            data.dof = moment(d, "YYMMDD").toDate();
            break;
        case RemarkSign.REG :
            data.reg = d;
            break;
        case RemarkSign.SEL :
            data.sel = d;
            break;
        case RemarkSign.CODE:
            data.code = d;
            break;
        case RemarkSign.RVR :
            data.rvr = d;
            break;
        case RemarkSign.OPR :
            data.opr = d;
            break;
        case RemarkSign.PER :
            data.per = d;
            break;
        case RemarkSign.RALT:
            data.ralt = d;
            break;
        case RemarkSign.TALT:
            data.talt = d;
            break;
        case RemarkSign.ORGN:
            data.orgn = d;
            break;
        case RemarkSign.COM :
            data.com = d;
            break;
        case RemarkSign.EET :
            data.eet = d;
            break;
        case RemarkSign.RMK :
            data.rmk = d;
            break;
        default:
            return;
    }
}

const decodeRemarks = (remarks: string, data: FlightPlanData) => {
    const remarkData = remarks.split(" ");
    for (let i = 0; i < remarkData.length; i++) {
        const remark = remarkData[i];
        const temp = remark.split("/");
        if (temp.length > 2) {
            data.voice = remark;
            continue;
        }
        if (temp.length == 1) {
            data.rmk += ` ${remark}`;
            continue;
        }
        setTargetData(data, temp[0], temp[1]);
    }
}

const fromFlightPlanModel = (data: FlightPlanModel): FlightPlanData => {
    const result: FlightPlanData = cloneDeep(defaultFlightPlanData);
    result.callsign = data.callsign;
    result.flight_rule = data.flight_rules;
    decodeAircraftType(data.aircraft, result);
    result.departure = data.departure;
    result.departure_time = moment.utc(padStart(data.departure_time.toString(), 4, '0'), "HHmm").toDate();
    result.altitude = parseAltitude(data.altitude);
    result.tas = data.cruise_tas;
    result.arrival = data.arrival;
    result.alternate = data.alternate;
    result.air_time = moment(`${data.route_time_hour}:${data.route_time_minute}`, "HH:mm").toDate();
    result.fuel_time = moment(`${data.fuel_time_hour}:${data.fuel_time_minute}`, "HH:mm").toDate();
    result.route = data.route
    decodeRemarks(data.remarks, result);
    return result;
}

const toICAOPlan = (data: FlightPlanData): string => {
    const lines = [];
    lines.push(`FPL-${data.callsign}-IS`);
    lines.push(encodeAircraftType(data));
    lines.push(`${data.departure}${moment(data.departure_time).utc().format("HHmm")}`);
    lines.push(`N${padStart(data.tas.toString(), 4, "0")}F${(data.altitude / 100).toFixed(0)} ${data.route}`);
    lines.push(`${data.arrival}${moment(data.air_time).format("HHmm")} ${data.alternate}`);
    lines.push(encodeRemarks(data));
    return `(${join(lines, " -")})`;
}

const fromICAOPlan = (raw: string): FlightPlanData => {
    const result: FlightPlanData = cloneDeep(defaultFlightPlanData);
    raw = raw.substring(1, raw.length - 1);
    let lines = raw.split(" -");
    if (lines.length < 6) {
        lines = lines[0].split("\n-");
        if (lines.length < 6) {
            showError("飞行计划格式错误");
            return;
        }
    }
    const callsignLine = lines[0].split("-");
    if (callsignLine.length < 3) {
        showError("飞行计划格式错误");
        return;
    }
    result.callsign = callsignLine[1];
    decodeAircraftType(lines[1], result);
    const departureLine = lines[2];
    result.departure = departureLine.substring(0, 4);
    result.departure_time = moment.utc(departureLine.substring(4), "HHmm").toDate();
    const routeLine = lines[3].split(" ");
    if (routeLine.length < 2) {
        showError("飞行计划格式错误");
        return;
    }
    if (routeLine[0].includes("F")) {
        const flightInfo = routeLine[0].split("F");
        if (flightInfo.length < 2) {
            showError("飞行计划格式错误");
            return;
        }
        result.tas = Number(flightInfo[0].substring(1));
        result.altitude = Number(flightInfo[1]) * 100;
    } else if (routeLine[0].includes("S")) {
        const flightInfo = routeLine[0].split("S");
        if (flightInfo.length < 2) {
            showError("飞行计划格式错误");
            return;
        }
        result.tas = (Number(flightInfo[0].substring(1)) / 1.852).toFixed(0);
        result.altitude = (Number(flightInfo[1]) * 10 * 3.281 / 100).toFixed(0) * 100;
    }
    result.route = join(routeLine.slice(1), " ").replace('\n', '');
    const destLine = lines[4].split(" ");
    if (destLine.length < 2) {
        showError("飞行计划格式错误");
        return;
    }
    result.arrival = destLine[0].substring(0, 4);
    result.air_time = moment(destLine[0].substring(4), "HHmm").toDate();
    result.alternate = destLine[1];
    decodeRemarks(lines[5], result);
    return result;
}

const sharedUrl = ref('');
const {copy, copied} = useClipboard({source: sharedUrl});

const sharePlans = () => {
    const currentUrl = document.location.href.split("?")[0];
    const plan = toICAOPlan(flightPlanFormData.value);
    sharedUrl.value = `${currentUrl}?raw=${encodeURI(plan)}&fuel_time=${moment(flightPlanFormData.value.fuel_time).format("HHmm")}`;
    copy(sharedUrl.value);
    if (copied) {
        showSuccess("复制分享链接成功");
    }
}

const icaoPlan = ref('');
const importFormDialogRef: Ref<FormDialogInstance> = ref();
const importFormInputRef: Ref<FormItemInstance> = ref();

const parseICAOPlan = () => {
    importFormInputRef.value.clearValidate()
    if (icaoPlan.value == "") {
        importFormInputRef.value.validateState = 'error';
        importFormInputRef.value.validateMessage = '此条目不能为空';
        return
    }
    flightPlanFormData.value = fromICAOPlan(icaoPlan.value);
    flightPlanFormData.value.flight_rule = 'I';
    if (flightPlanFormData.value.voice == "") {
        flightPlanFormData.value.voice = '/V/';
    }
    importFormDialogRef.value?.hide();
}

const simbriefIdent = useStorage("simbrief", "");
const askSimbriefDialogRef: Ref<FormDialogInstance> = ref();
const simbriefLoading = ref(false);

const getFromSimbrief = async () => {
    simbriefLoading.value = true;
    let url: string;
    if (isNaN(parseInt(simbriefIdent.value))) {
        url = `https://www.simbrief.com/api/xml.fetcher.php?username=${simbriefIdent.value}&json=v2`;
    } else {
        url = `https://www.simbrief.com/api/xml.fetcher.php?userid=${simbriefIdent.value}&json=v2`;
    }
    const response = await axios.get(url) as AxiosXHR<any>;
    if (response.status != 200) {
        return;
    }
    icaoPlan.value = response.data.atc.flightplan_text;
    flightPlanFormData.value = fromICAOPlan(icaoPlan.value);
    flightPlanFormData.value.flight_rule = 'I';
    if (flightPlanFormData.value.voice == "") {
        flightPlanFormData.value.voice = '/V/';
    }
    flightPlanFormData.value.fuel_time = moment(response.data.times.endurance, "HH:mm:ss").toDate();
    askSimbriefDialogRef.value?.hide();
    showSuccess("导入成功")
    simbriefLoading.value = false;
}

const confirmDeleteFlightPlanRef: Ref<ConfirmDialogInstance> = ref();

const deleteFlightPlan = async () => {
    if (await ApiFlightPlan.deleteSelfFlightPlan()) {
        showSuccess("删除计划成功");
        flightPlanFormData.value = cloneDeep(defaultFlightPlanData);
        return;
    }
}

const flightPlanLocked = ref(false);
const flightPlanFormRef: Ref<FormInstance> = ref();

const submitFlightPlan = async () => {
    try {
        await flightPlanFormRef.value.validate();
    } catch {
        showError("飞行计划校验失败");
        return;
    }
    if (await ApiFlightPlan.submitFlightPlan(toFlightPlanModel(flightPlanFormData.value))) {
        showSuccess("提交计划成功");
        flightPlanLocked.value = false;
        return;
    }
}

onMounted(async () => {
    if (route.query.raw) {
        icaoPlan.value = decodeURI(route.query.raw);
        flightPlanFormData.value = fromICAOPlan(icaoPlan.value);
        flightPlanFormData.value.flight_rule = 'I';
        if (flightPlanFormData.value.voice == "") {
            flightPlanFormData.value.voice = '/V/';
        }
        flightPlanFormData.value.fuel_time = moment(route.query.fuel_time, "HHmm").toDate();
        return;
    }
    if (route.query.activity_plan) {
        const activity_plan = decodeURI(route.query.activity_plan);
        const data = activity_plan.substring(1, activity_plan.length - 1).split("-");
        if (data.length < 3) {
            showError("参数解析失败");
            return;
        }
        flightPlanFormData.value.flight_rule = 'I';
        flightPlanFormData.value.voice = '/V/';
        flightPlanFormData.value.departure = data[0].split(" ")[0];
        flightPlanFormData.value.arrival = data[1].split(" ")[0];
        flightPlanFormData.value.route = data[2];
        if (data.length >= 4) {
            flightPlanFormData.value.callsign = data[3];
        }
        if (data.length >= 5) {
            flightPlanFormData.value.flight_type = data[4];
        }
        return;
    }
    const data = await ApiFlightPlan.getSelfFlightPlan();
    if (data == null) {
        return;
    }
    flightPlanLocked.value = data.locked;
    if (data.locked) {
        showWarning("您的飞行计划已被锁定");
    }
    flightPlanFormData.value = fromFlightPlanModel(data);
})

const handleDepartureSelect = (airport: Airport) => {
    flightPlanFormData.value.departure = airport.icao;
    flightPlanFormRef.value.clearValidate();
}

const handleArrivalSelect = (airport: Airport) => {
    flightPlanFormData.value.arrival = airport.icao;
    flightPlanFormRef.value.clearValidate();
}

const handleAlternateSelect = (airport: Airport) => {
    flightPlanFormData.value.alternate = airport.icao;
    flightPlanFormRef.value.clearValidate();
}
</script>

<template>
    <el-card class="no-transform" header-class="flex justify-content-between">
        <template #header>
            <el-space wrap>
                <span>提交飞行计划</span>
                <el-button :icon="Download" type="primary" @click="askSimbriefDialogRef?.show()">
                    从Simbrief导入
                </el-button>
                <el-button :icon="Delete" type="danger" @click="confirmDeleteFlightPlanRef?.show()"
                           v-if="!flightPlanLocked">
                    删除飞行计划
                </el-button>
            </el-space>
            <el-space wrap>
                <el-button :icon="Share" type="primary" @click="sharePlans()">
                    分享飞行计划
                </el-button>
                <el-button type="primary" @click="importFormDialogRef?.show()">
                    导入ICAO计划
                </el-button>
            </el-space>
        </template>
        <el-alert v-if="flightPlanLocked" type="error" :closable="false" show-icon>
            <p>请注意，您的飞行计划已锁定</p>
            <p>您可以提交一份起落机场不同的飞行计划来自动解锁</p>
            <p>或者断开与服务器的连接超过40s</p>
            <p>或者联系管理员帮你解锁</p>
        </el-alert>
        <el-form label-position="top" :rules="flightPlanFormRule" :model="flightPlanFormData" ref="flightPlanFormRef">
            <el-space fill wrap>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="呼号" prop="callsign">
                            <el-tooltip content="填写你连线时的呼号" placement="top">
                                <el-input v-model="flightPlanFormData.callsign" placeholder="CES2352"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="飞行类型" required>
                            <el-tooltip content="选择飞行类型" placement="top">
                                <el-select v-model="flightPlanFormData.flight_rule"
                                           :options="flightRule"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="飞机类型(ICAO)" prop="flight_type">
                            <el-tooltip content="请输入飞机类型代码" placement="top">
                                <el-input v-model="flightPlanFormData.flight_type" placeholder="A320"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="尾流分类" prop="wake_category">
                            <el-tooltip content="请选择尾流等级" placement="top">
                                <el-select v-model="flightPlanFormData.wake_category"
                                           :options="wakeCategory"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12">
                        <el-form-item label="设备代码(ICAO/FAA)" prop="equipment_code">
                            <el-tooltip content="请输入设备代码" placement="top">
                                <el-input v-model="flightPlanFormData.equipment_code" placeholder="SDE3...L"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12">
                        <el-tooltip content="请输入二次雷达代码" placement="top">
                            <el-form-item label="二次雷达代码(仅ICAO)">
                                <el-input v-model="flightPlanFormData.transponder_code" placeholder="L"/>
                            </el-form-item>
                        </el-tooltip>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="离场机场(ICAO)" prop="departure">
                            <el-tooltip content="请输入离场机场ICAO码" placement="top">
                                <el-autocomplete v-model="flightPlanFormData.departure" placeholder="ZSSS"
                                                 :fetch-suggestions="activityStore.queryAirports"
                                                 @select="airport => handleDepartureSelect(airport)"
                                                 clearable/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="离场时间(HHMM)" required>
                            <el-tooltip content="请输入离场时间" placement="top">
                                <el-time-picker v-model="flightPlanFormData.departure_time"
                                                placeholder="12:00"
                                                format="HH:mm" class="w-full"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="巡航高度(ft)" prop="altitude">
                            <el-tooltip content="请输入计划巡航高度" placement="top">
                                <el-input v-model.number="flightPlanFormData.altitude" placeholder="34100"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="巡航真空速(knots)" prop="tas">
                            <el-tooltip content="请输入巡航真空速" placement="top">
                                <el-input v-model.number="flightPlanFormData.tas" placeholder="450"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="到达机场(ICAO)" prop="arrival">
                            <el-tooltip content="请输入到达机场ICAO码" placement="top">
                                <el-autocomplete v-model="flightPlanFormData.arrival" placeholder="ZGHA"
                                                 :fetch-suggestions="activityStore.queryAirports"
                                                 @select="airport => handleArrivalSelect(airport)"
                                                 clearable/>
                                <el-input v-model="flightPlanFormData.arrival" placeholder="ZGHA"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="备降机场(ICAO)">
                            <el-tooltip content="请输入备降机场ICAO码" placement="top">
                                <el-autocomplete v-model="flightPlanFormData.alternate" placeholder="ZHHH"
                                                 :fetch-suggestions="activityStore.queryAirports"
                                                 @select="airport => handleAlternateSelect(airport)"
                                                 clearable/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="飞行时间(HHMM)" required>
                            <el-tooltip content="请输入飞行时间" placement="top">
                                <el-time-picker v-model="flightPlanFormData.air_time"
                                                placeholder="02:00"
                                                format="HH:mm" class="w-full"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="滞空时间(HHMM)" required>
                            <el-tooltip content="请输入滞空时间" placement="top">
                                <el-time-picker v-model="flightPlanFormData.fuel_time"
                                                placeholder="03:00"
                                                format="HH:mm" class="w-full"/>
                            </el-tooltip>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24">
                        <el-form-item label="航路" prop="route">
                            <el-input v-model="flightPlanFormData.route" type="textarea"
                                      :autosize="{minRows: 6, maxRows: 12}"/>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-alert type="warning" show-icon :closable="false">
                    <p>下方的内容, 如果不知道写什么, 可以视情况不填写</p>
                </el-alert>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="PBN/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Performance-Based Navigation</p>
                                    <p>超出部分请附加在 NAV/ 部分</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.pbn"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="NAV/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Navigation Capabilities（导航能力）</p>
                                    <p>包括PBN多余的还有自己独属的</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.nav"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="DAT/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Other Data Application</p>
                                    <p>其他数据应用</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.dat"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="SUR/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Other Surv Capability</p>
                                    <p>其他监视能力</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.sur"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="DOF/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Date Of Flight</p>
                                    <p>飞行计划执行日期</p>
                                </el-alert>
                                <el-date-picker v-model="flightPlanFormData.dof" type="date" class="w-full"
                                                :disabled-date="date => moment().subtract({day: 1}).isAfter(date)"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="REG/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Aircraft Registration（航空器注册号）</p>
                                    <p>填写飞机的注册号</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.reg"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="SEL/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>SELCAL Code（选择性呼叫代码）</p>
                                    <p>填写飞机的 SELCAL 代码</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.sel"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="CODE/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Aircraft Address（飞机地址）</p>
                                    <p>填写24位 ICAO 分配的机载地址</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.code"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="RVR/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Runway Visual Range（跑道视程）</p>
                                    <p>填写特殊运行所需的跑道最低视程</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.rvr"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="OPR/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Operator（航空公司）</p>
                                    <p>填写航空公司的三字码</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.opr"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="PER/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Performance Category（性能分类）</p>
                                    <p>飞机的性能类别</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.per"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="RALT/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Enroute Alternate(s)</p>
                                    <p>途中备降（ICAO机场代码）</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.ralt"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="TALT/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Take-off Alternate(s)</p>
                                    <p>起飞替代方案（ICAO机场代码）</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.talt"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="ORGN/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Flight Plan Originator</p>
                                    <p>飞行计划制定者</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.orgn"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="COM/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Other Communications</p>
                                    <p>其他通信能力</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.com"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="12" :lg="6">
                        <el-form-item label="EET/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Estimated Elapsed Times</p>
                                    <p>预计经过时间</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.eet"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="10">
                    <el-col :span="24" :md="18">
                        <el-form-item label="RMK/">
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>Remarks（备注）填写额外信息，可以备注TCAS*</p>
                                    <p>例如 RMK/EXERCISE FLIGHT 表示本次航班为训练飞行等</p>
                                </el-alert>
                                <el-input v-model="flightPlanFormData.rmk"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :md="6">
                        <el-form-item label="交流类型" required>
                            <el-space fill class="w-full">
                                <el-alert show-icon :closable="false" type="primary">
                                    <p>填写与管制的交流类型</p>
                                    <p>双向语音、仅接收语音、纯文字</p>
                                </el-alert>
                                <el-select v-model="flightPlanFormData.voice" :options="voiceType"/>
                            </el-space>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-space>
        </el-form>
        <template #footer>
            <el-button :icon="Check" type="success" @click="submitFlightPlan()">
                提交飞行计划
            </el-button>
        </template>
    </el-card>
    <FormDialog ref="importFormDialogRef" title="导入ICAO计划" :width="500" @dialog-confirm-event="parseICAOPlan()">
        <el-form-item ref="importFormInputRef" required>
            <el-input v-model="icaoPlan"
                      type="textarea"
                      :rows="10"
                      placeholder="(FPL-CES2352-IS
-A20N/M-SDE2E3FGHIRWXY/LB1
-ZYHB1230
-K0874S1040 LEG19D LEGAG W204 RUSBO G212 TGO/K0869S1100 B334 KAKAT W28 VERMI DCT TMR TMR9XA
-ZBHH0207 ZBAD
-PBN/A1B1C1D1O1S2 DOF/250924 REG/CGTLT EET/ZBPE0107 SEL/FMLP OPR/CES PER/C RMK/TCAS)"/>
        </el-form-item>
    </FormDialog>
    <FormDialog ref="askSimbriefDialogRef" title="Simbrief ID或Username"
                @dialog-confirm-event="getFromSimbrief()" :loading="simbriefLoading">
        <el-input v-model="simbriefIdent" placeholder="数字ID或者用户名均可"/>
    </FormDialog>
    <ConfirmDialog ref="confirmDeleteFlightPlanRef" body-content="确认删除已存在的飞行计划吗？"
                   header-content="删除飞行计划" @confirm-event="deleteFlightPlan"/>
</template>

<style scoped>

</style>