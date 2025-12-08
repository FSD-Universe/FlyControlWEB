<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref, Ref, watch} from 'vue';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {fromLonLat, transformExtent} from 'ol/proj';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import Overlay from 'ol/Overlay';
import axios from "axios";
import 'ol/ol.css';
import {Layer} from "ol/layer.js";
import {showError} from "@/utils/message.js";
import {LineString} from "ol/geom.js";
import {GeoJSON, MVT} from "ol/format.js";
import {join} from "lodash";
import {get as getProjection} from 'ol/proj.js';
import VectorTileLayer from "ol/layer/VectorTile.js";
import VectorTileSource from 'ol/source/VectorTile.js';
import {TileGrid} from "ol/tilegrid.js";
import {applyStyle} from 'ol-mapbox-style';
import config from "@/config/index.js";
import {ImageStatic, Source, XYZ} from "ol/source.js";
import {Cloudy, Expand} from "@element-plus/icons-vue";
import {formatCid} from "@/utils/utils.js";
import {useServerConfigStore} from "@/store/server_config.js";
import {useToggle} from "@vueuse/core";
import ApiClient from "@/api/client.js";
import {useUserStore} from "@/store/user.js";
import AxiosXHR = Axios.AxiosXHR;
import ImageLayer from "ol/layer/Image.js";

const serverConfigStore = useServerConfigStore();
const userStore = useUserStore();

const showDetailList = ref(false);
const toggleDetailList = useToggle(showDetailList);

const resolutions = [];
for (let i = 0; i <= 8; ++i) {
    resolutions.push(156543.03392804097 / Math.pow(2, i * 2));
}

function tileUrlFunction(tileCoord) {
    return (
        'https://{a-d}.tiles.mapbox.com/v4/mapbox.mapbox-streets-v8/' +
        '{z}/{x}/{y}.vector.pbf?language=zh-Hans&access_token=' + config.mapbox_token
    )
        .replace('{z}', String(tileCoord[0] * 2 - 1))
        .replace('{x}', String(tileCoord[1]))
        .replace('{y}', String(tileCoord[2]))
        .replace(
            '{a-d}',
            'abcd'.substr(((tileCoord[1] << tileCoord[0]) + tileCoord[2]) % 4, 1)
        );
}

const layers = {
    OSM: new TileLayer({
        title: 'OSM',
        visible: false,
        source: new OSM()
    }),
    Mapbox: new VectorTileLayer({
        title: 'Mapbox',
        visible: false,
        source: new VectorTileSource({
            attributions:
                '<a href="https://www.mapbox.com/about/maps">© Mapbox</a> ' +
                '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> ' +
                '<a href="https://www.maxar.com/">© Maxar</a>',
            format: new MVT(),
            tileGrid: new TileGrid({
                extent: getProjection('EPSG:3857')?.getExtent(),
                resolutions: resolutions,
                tileSize: 512
            }),
            tileUrlFunction: tileUrlFunction
        })
    }),
    MapboxTile: new TileLayer({
        visible: false,
        source: new XYZ({
            url: "https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}.webp?access_token=" + config.mapbox_token,
            crossOrigin: 'anonymous',
            wrapX: true
        })
    }),
    GaoDe: new TileLayer({
        visible: false,
        source: new XYZ({
            url: "https://webst01.is.autonavi.com/appmaptile?style=7&x={x}&y={y}&z={z}",
            crossOrigin: 'anonymous',
            wrapX: true
        })
    }),
    GaoDeSatellite: new TileLayer({
        visible: false,
        source: new XYZ({
            url: "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
            crossOrigin: 'anonymous',
            wrapX: true
        })
    }),
    ArcGis: new TileLayer({
        visible: false,
        source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            crossOrigin: 'anonymous',
            wrapX: true
        })
    })
}

// 地图引用
const mapContainer = ref<HTMLElement>();
const map = ref<OlMap | null>(null);
const selectedFeature = ref<Feature | null>(null);
const popup = ref<Overlay>();
const popupContent = ref<string>('');
const selectedLayer = ref("GaoDe");
const mapBoxAvailable = ref(false)

watch(() => selectedLayer.value, (value: string, oldValue: string) => {
    const oldLayers = layers[oldValue]
    const newLayers = layers[value]
    if (oldLayers && newLayers) {
        oldLayers.setVisible(false)
        newLayers.setVisible(true)
    }
})

const onlinePilots: Map<string, OnlinePilotModel> = new Map();
const onlineController: Map<string, OnlineControllerModel> = new Map();
const onlinePilotList: Ref<OnlinePilotModel[]> = ref([]);
const onlineControllerList: Ref<OnlineControllerModel[]> = ref([]);

const fetchWhazzupData = async () => {
    const data = await ApiClient.getOnlineClient();
    if (data != null) {
        const pilots = new Set();
        data.pilots.forEach(pilot => {
            pilots.add(pilot.callsign)
            onlinePilots.set(pilot.callsign, pilot)
        });
        onlinePilots.forEach(pilot => {
            if (!pilots.has(pilot.callsign)) {
                onlinePilots.delete(pilot.callsign)
            }
        });
        onlinePilotList.value = onlinePilots.values().toArray();
        const controllers = new Set();
        data.controllers.forEach(controller => {
            controllers.add(controller.callsign)
            onlineController.set(controller.callsign, controller)
        });
        onlineController.forEach(controller => {
            if (!controllers.has(controller.callsign)) {
                onlineController.delete(controller.callsign)
            }
        });
        onlineControllerList.value = onlineController.values().toArray();
    }
}

let lineLayer: Layer;
let aircraftLayer: Layer;
let centerSource: VectorSource;
const centerFeatureMap: Map<string, Feature> = new Map();
let centerLayer: Layer;
let approachSource: VectorSource;
const approachFeatureMap: Map<string, Feature> = new Map();
let approachLayer: Layer;
let towerLayer: Layer;
let weatherLayer: Layer;
let lineFeature: Feature | null = null;
let interval: number;

const weatherShow = ref(false);
const weatherUrl = ref('');
const generateTime = ref(0);
const toggleWeather = useToggle(weatherShow);
const loadingWeather = ref(false);
const toggleLoadingWeather = useToggle(loadingWeather);

const generateWeatherUrl = async () => {
    const response = await axios.get(`https://api.rainviewer.com/public/weather-maps.json`) as AxiosXHR<any>;
    if (response.status == 200 && generateTime.value != response.data.generated) {
        const baseUrl = response.data.host;
        const availableData = response.data.radar.past;
        const selectData = availableData[availableData.length - 1].path;
        weatherUrl.value = `${baseUrl}${selectData}/256/{z}/{x}/{y}/3/1_1.png`;
    }
}

const toggleWeatherShow = async () => {
    toggleLoadingWeather();
    toggleWeather();
    await generateWeatherUrl();
    weatherLayer.setVisible(weatherShow.value);
    if (weatherShow.value) {
        weatherLayer.setSource(new XYZ({
            url: weatherUrl.value,
            crossOrigin: 'anonymous',
            wrapX: true
        }))
    }
    toggleLoadingWeather();
}

const createStyle = (heading: number): Style => {
    return new Style({
        image: new Icon({
            src: '/images/aircraft.png',
            scale: 0.5,
            anchor: [0.5, 0.5],
            opacity: 0.9,
            rotation: heading * Math.PI / 180.0
        })
    });
}

const updatePilotInfo = (pilot: OnlinePilotModel, feature: Feature) => {
    if (!feature || !pilot) {
        return
    }
    feature.set('cid', formatCid(pilot.cid));
    feature.set('flightPlan', pilot.flight_plan);
    feature.set('groundSpeed', pilot.ground_speed);
    feature.set('altitude', pilot.altitude);
    feature.set('transponder', pilot.transponder);
    feature.setStyle(createStyle(pilot.heading));
}

const updateControllerInfo = (controller: OnlineControllerModel, feature: Feature) => {
    if (!feature || !controller) {
        return
    }
    feature.set("callsign", controller.callsign);
    feature.set("frequency", controller.frequency);
    feature.set("atis", controller.atc_info);
    feature.set("cid", controller.cid);
    feature.set("offline_time", controller.offline_time);
    feature.set("is_break", controller.is_break);
}

const flushMapShow = () => {
    const currentPilots = new Set();
    const currentControllers = new Set();

    // 处理飞行员数据
    onlinePilots.values().forEach(pilot => {
        const pilotId = `${pilot.callsign}-${pilot.cid}`;
        currentPilots.add(pilotId);
        let feature = aircraftLayer.getSource().getFeatureById(pilotId);

        if (!feature) {
            feature = new Feature({
                geometry: new Point(fromLonLat([pilot.longitude, pilot.latitude])),
                isPilot: true,
                cid: formatCid(pilot.cid),
                callsign: pilot.callsign,
                flightPlan: pilot.flight_plan,
                groundSpeed: pilot.ground_speed,
                altitude: pilot.altitude,
                transponder: pilot.transponder
            });
            feature.setId(pilotId);
            feature.setStyle(createStyle(pilot.heading));
            aircraftLayer.getSource().addFeature(feature);
            return;
        }
        const geometry = feature.getGeometry();
        if (geometry instanceof Point) {
            geometry.setCoordinates(fromLonLat([pilot.longitude, pilot.latitude]));
        }
        updatePilotInfo(pilot, feature);
    });

    const existingPilotFeatures = aircraftLayer.getSource().getFeatures();
    existingPilotFeatures.forEach(feature => {
        if (feature.get('isPilot')) {
            const pilotId = feature.getId();
            if (!currentPilots.has(pilotId)) {
                aircraftLayer.getSource().removeFeature(feature);
            }
        }
    });

    onlineController.values().forEach(controller => {
        const controllerId = `${controller.callsign}-${controller.cid}`;
        currentControllers.add(controllerId);
        let feature: Nullable<Feature> = null;
        let source: Nullable<Source> = null;
        let baseFeature: Nullable<Feature> = null;
        const hasBorder = controller.facility == 6 || controller.facility == 5 || controller.facility == 1;

        switch (controller.facility) {
            case 6: {
                source = centerLayer.getSource();
                feature = source.getFeatureById(controllerId);
                const sector = controller.callsign.replace("_CTR", "").replaceAll("_", "-");
                if (sector.startsWith("HKG-W")) {
                    baseFeature = centerFeatureMap.get("VHHK")?.clone()
                    break;
                }
                baseFeature = centerFeatureMap.get(sector)?.clone()
                break;
            }
            case 5: {
                source = approachLayer.getSource();
                feature = source.getFeatureById(controllerId);
                const tmp = controller.callsign.split("_");
                const callsign = tmp.slice(0, tmp.length - 1);
                baseFeature = approachFeatureMap.get(join(callsign, '_'))?.clone()
                break;
            }
            case 4:
            case 3:
            case 2:
                source = towerLayer.getSource();
                feature = source.getFeatureById(controllerId);
                break;
            case 1:
                source = centerLayer.getSource();
                feature = source.getFeatureById(controllerId);
                if (controller.callsign.toUpperCase() === "PRC_FSS") {
                    baseFeature = centerFeatureMap.get("PRC")?.clone()
                }
                break;
            default:
                // 不是合法管制员，不显示在地图上
                return
        }

        if (!feature && !baseFeature && hasBorder) {
            // 无实体且没找到对应边界实体
            return;
        }

        if (controller.facility == 1) {
            if (feature) {
                updateControllerInfo(controller, feature)
                return;
            }
            feature = baseFeature;
            feature.setId(controllerId);
            feature.set("isPilot", false);
            updateControllerInfo(controller, feature)
            source.addFeature(feature);
            return;
        }

        if (controller.facility == 6) {
            // CTR
            if (feature && baseFeature) {
                updateControllerInfo(controller, feature)
                return;
            }
            feature = baseFeature;
            feature.setId(controllerId);
            feature.set("isPilot", false);
            updateControllerInfo(controller, feature)
            source.addFeature(feature);
            return;
        }

        if (controller.facility == 5) {
            // APP
            if (feature) {
                updateControllerInfo(controller, feature)
                return;
            }

            feature = baseFeature;
            feature.setId(controllerId);
            feature.set("isPilot", false);
            updateControllerInfo(controller, feature)
            source.addFeature(feature);
            return;
        }

        if (controller.facility >= 2 && controller.facility <= 4) {
            // TWR GND DEL
            if (feature) {
                const geometry = feature.getGeometry();
                if (geometry instanceof Point) {
                    geometry.setCoordinates(fromLonLat([controller.longitude, controller.latitude]));
                }
                updateControllerInfo(controller, feature);
                return;
            }
            feature = new Feature({
                geometry: new Point(fromLonLat([controller.longitude, controller.latitude])),
                isPilot: false,
                callsign: controller.callsign,
                frequency: controller.frequency,
                offline_time: controller.offline_time,
                is_break: controller.is_break,
                atis: controller.atc_info,
                cid: formatCid(controller.cid)
            });
            feature.setId(controllerId);
            feature.setStyle(new Style({
                image: new Circle({
                    radius: 6,
                    fill: new Fill({
                        color: '#c8504e'
                    })
                })
            }));
            source.addFeature(feature);
        }
    });

    [centerLayer, approachLayer, towerLayer].forEach(layer => {
        const source = layer.getSource();
        const features = source.getFeatures();
        features.forEach(feature => {
            if (!feature.get('isPilot')) {
                const controllerId = feature.getId();
                if (!currentControllers.has(controllerId)) {
                    source.removeFeature(feature);
                }
            }
        });
    });
}

// const calculateAdjustedExtent = (data: BoundingBox, width: number, height: number) => {
//     if (data.latlng == undefined) {
//         throw new Error("Latitude and longitude are not provided");
//     }
//     const diffX = Math.abs(data.pixels.x2 - data.pixels.x1);
//     const diffY = Math.abs(data.pixels.y1 - data.pixels.y2);
//
//     const lonPerPixel = Math.abs(data.latlng.lng2 - data.latlng.lng1) / diffX;
//     const latPerPixel = Math.abs(data.latlng.lat1 - data.latlng.lat2) / diffY;
//
//     data.latlng.lng1 = data.latlng.lng1 - lonPerPixel * data.pixels.x1;
//     data.latlng.lat1 = data.latlng.lat1 - latPerPixel * (height - data.pixels.y1);
//     data.latlng.lng2 = data.latlng.lng2 + lonPerPixel * (width - data.pixels.x2);
//     data.latlng.lat2 = data.latlng.lat2 + lonPerPixel * data.pixels.y2;
//
//     return transformExtent([
//         data.latlng.lng1, data.latlng.lat1,
//         data.latlng.lng2, data.latlng.lat2
//     ], 'EPSG:4326', 'EPSG:3857');
// }

// const bound = {
//     "pixels": {
//         "x1": 103,
//         "y1": 2048,
//         "x2": 2535,
//         "y2": 168
//     },
//     "latlng": {
//         "lng1": 112.99008333333333,
//         "lat1": 23.12922222222222,
//         "lng2": 114.36927777777778,
//         "lat2": 24.111416666666667
//     }
// };
// const w = 2623;
// const h = 2153;

// let imageLayer = null;
// 初始化地图
onMounted(async () => {
    if (!mapContainer.value) return;

    mapBoxAvailable.value = config.mapbox_token != ""

    if (mapBoxAvailable.value) {
        await applyStyle(layers.Mapbox, 'mapbox://styles/mapbox/streets-v12', {accessToken: config.mapbox_token});
    } else {
        showError("未设置Mapbox Token, Mapbox 瓦片服务不可用")
    }

    // 创建地图
    map.value = new OlMap({
        target: mapContainer.value,
        layers: [layers.OSM, layers.Mapbox, layers.MapboxTile, layers.GaoDeSatellite, layers.GaoDe, layers.ArcGis],
        view: new View({
            center: fromLonLat([120, 30]),
            zoom: 4
        })
    });

    lineLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
            stroke: new Stroke({
                color: config.flight_path_color,
                width: 3
            })
        })
    });

    aircraftLayer = new VectorLayer({
        source: new VectorSource()
    })

    const centerSourceFormat = new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    })

    centerSource = new VectorSource({
        features: centerSourceFormat.readFeatures(await (await fetch("/data/Boundaries.geojson")).json())
    })

    centerSource.forEachFeature(feature => {
        centerFeatureMap.set(feature.get("id") as string, feature)
    })

    centerLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
            stroke: new Stroke({
                color: config.atc_border,
                width: 2
            }),
            fill: new Fill({
                color: config.atc_fill
            })
        })
    })

    const approachSourceFormat = new GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    })

    approachSource = new VectorSource({
        features: approachSourceFormat.readFeatures(await (await fetch("/data/TRACONBoundaries.geojson")).json())
    })

    approachSource.forEachFeature(feature => {
        approachFeatureMap.set(feature.get("id") as string, feature)
    })

    approachLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
            stroke: new Stroke({
                color: config.atc_border,
                width: 2
            }),
            fill: new Fill({
                color: config.atc_fill
            })
        })
    })

    towerLayer = new VectorLayer({
        source: new VectorSource(),
        style: new Style({
            image: new Circle({
                radius: 6,
                fill: new Fill({
                    color: '#c8504e'
                })
            })
        })
    })

    await generateWeatherUrl();

    weatherLayer = new TileLayer({
        visible: false,
        source: new XYZ({
            url: weatherUrl.value,
            crossOrigin: 'anonymous',
            wrapX: true
        })
    })

    // const imageSource = new ImageStatic({
    //     url: `${config.backend_url}/charts/https://api.navigraph.com/v2/charts/ZGGG/zggg116a_d.png`,
    //     imageExtent: calculateAdjustedExtent(bound, w, h),
    //     crossOrigin: 'anonymous',
    //     imageLoadFunction: function (image, src) {
    //         const xhr = new XMLHttpRequest();
    //         xhr.open('GET', src);
    //
    //         xhr.setRequestHeader('Authorization', 'Bearer ' + userStore.token);
    //
    //         xhr.responseType = 'blob';
    //         xhr.onload = function () {
    //             if (xhr.status === 200) {
    //                 const blob = xhr.response;
    //                 image.getImage().src = URL.createObjectURL(blob);
    //             }
    //         };
    //         xhr.send();
    //     }
    // });
    //
    // imageLayer = new ImageLayer({
    //     source: imageSource,
    //     visible: true,
    //     opacity: 0.7
    // });

    map.value.addLayer(centerLayer);
    map.value.addLayer(approachLayer);
    map.value.addLayer(weatherLayer);
    map.value.addLayer(lineLayer);
    map.value.addLayer(aircraftLayer);
    map.value.addLayer(towerLayer);
    // map.value.addLayer(imageLayer);

    // 初始化弹出框
    initializePopup();

    // 添加点击事件处理
    setupClickHandler();

    layers[selectedLayer.value].setVisible(true);

    await fetchWhazzupData();
    flushMapShow()

    interval = setInterval(async () => {
        await fetchWhazzupData();
        flushMapShow()
    }, 15000)
});


const drawLine = async (callsign: string) => {
    if (lineFeature != null) {
        lineLayer.getSource().clear();
        lineFeature = null;
    }

    const pointsData = await ApiClient.getClientFlightPath(callsign);
    if (pointsData == null) {
        showError("获取飞行路径失败")
        return;
    }

    const coordinates = pointsData.map(point =>
        fromLonLat([point.longitude, point.latitude])
    );

    lineFeature = new Feature({geometry: new LineString(coordinates)});

    lineLayer.getSource().addFeature(lineFeature);
}


const removeLine = () => {
    if (lineFeature == null) {
        return
    }

    lineLayer.getSource().clear();
    lineFeature = null;
}

// 初始化弹出框
const initializePopup = () => {
    if (!map.value) return;

    const popupElement = document.getElementById('popup');
    if (!popupElement) return;

    popup.value = new Overlay({
        element: popupElement,
        positioning: 'top-right',
        offset: [-10, 0],
        autoPan: {
            animation: {
                duration: 250
            }
        }
    });

    map.value?.addOverlay(popup.value);
};

// 设置点击事件处理
const setupClickHandler = () => {
    if (!map.value) return;

    map.value?.on('click', async (event) => {
        // 关闭弹出框
        closePopup();

        // 获取点击的要素
        const feature = map.value?.forEachFeatureAtPixel(
            event.pixel,
            (feature) => feature
        );

        if (feature) {
            // 显示弹出框
            showPopup(feature, event.coordinate);
            const isPilot = feature.get("isPilot") as boolean;
            if (isPilot) {
                await drawLine(feature.get("callsign") as string);
            }

            // 阻止事件冒泡
            event.stopPropagation();
        } else {
            selectedFeature.value = null;
        }
    });
};

// 显示弹出框
const showPopup = (feature: Feature, coordinate: number[]) => {
    if (!popup.value) return;

    const isPilot = feature.get("isPilot");
    if (isPilot == undefined) {
        return;
    }

    if (isPilot) {
        const callsign = feature.get('callsign') as string;
        const flightPlan = feature.get('flightPlan') as Nullable<FlightPlanModel>;
        const groundSpeed = feature.get('groundSpeed') as number;
        const altitude = feature.get('altitude') as number;
        const transponder = feature.get('transponder') as string;
        const cid = feature.get('cid') as string;

        let content = `
            <h3>${callsign}</h3>
            <p>${formatCid(cid)}</p>
            <p>应答机: ${transponder}</p>
            <p>地速：${groundSpeed}kt</p>
            <p>高度：${altitude}ft</p>
          `;
        if (flightPlan) {
            content += `
                <p>机型: ${flightPlan.aircraft.split("-")[0]}</p>
                <p>出发机场: ${flightPlan.departure}</p>
                <p>到达机场: ${flightPlan.arrival}</p>
            `;
        } else {
            content += `<p>平等的看不起任何不交计划的人</p>`
        }
        popupContent.value = content;
    } else {
        const callsign = feature.get('callsign') as string;
        const frequency = (Number(feature.get('frequency')) / 1000).toFixed(3);
        const cid = feature.get('cid') as string;
        const atcInfo = join(feature.get('atis') as string[], '<br/>');
        const offline_time = feature.get("offline_time") as string;
        const is_break = feature.get("is_break") as boolean;

        popupContent.value = `
        <h3>${callsign}</h3>
        <p>频率: ${frequency}</p>
        <p>CID: ${formatCid(cid)}</p>
        <p>关扇时间: ${offline_time ? offline_time + 'Z' : '未提供'}</p>
        <p>暂时离开: ${is_break ? '是' : '否'}</p>
        <p>ATC-INFO: </p>
        <p>${atcInfo}</p>
        `
    }

    popup.value.setPosition(coordinate);
};

// 关闭弹出框
const closePopup = () => {
    if (popup.value) {
        popup.value.setPosition(undefined);
        removeLine();
    }
};

// 组件卸载时清理
onUnmounted(() => {
    if (map.value) {
        map.value.setTarget(undefined);
        map.value = null;
    }
    clearInterval(interval);
});

</script>

<template>
    <div class="map-wrapper">
        <div ref="mapContainer" id="map" class="map-container"></div>
        <div id="popup" class="ol-popup">
            <div id="popup-content" v-html="popupContent"></div>
        </div>
        <div class="ol-switch">
            <el-radio-group v-model="selectedLayer" class="map-selector">
                <el-radio value="OSM" label="OSM地图"/>
                <el-radio value="Mapbox" label="Mapbox向量图" :disabled="!mapBoxAvailable"/>
                <el-radio value="MapboxTile" label="Mapbox卫星图" :disabled="!mapBoxAvailable"/>
                <el-radio value="GaoDe" label="高德地图"/>
                <el-radio value="GaoDeSatellite" label="高德卫星图"/>
                <el-radio value="ArcGis" label="ArcGis卫星图"/>
            </el-radio-group>
        </div>
        <div class="ol-tab">
            <el-space class="ol-tab-show">
                <el-button type="primary" :icon="Expand" @click="toggleDetailList()"/>
                <el-button type="primary" :icon="Cloudy" @click="toggleWeatherShow()" :loading="loadingWeather"/>
            </el-space>
        </div>
        <Transition name="online">
            <div class="left-box" v-if="showDetailList">
                <el-table :data="onlinePilotList" height="100%" class="data-table">
                    <el-table-column label="呼号" prop="callsign"/>
                    <el-table-column label="CID">
                        <template #default="scope">
                            {{ formatCid(scope.row.cid) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="地速">
                        <template #default="scope">
                            {{ scope.row.ground_speed }} kt
                        </template>
                    </el-table-column>
                    <el-table-column label="高度">
                        <template #default="scope">
                            {{ scope.row.altitude }} ft
                        </template>
                    </el-table-column>
                    <el-table-column label="应答机" prop="transponder"/>
                </el-table>
            </div>
        </Transition>
        <Transition name="online">
            <div class="right-box" v-if="showDetailList">
                <el-table :data="onlineControllerList" height="100%" class="data-table">
                    <el-table-column label="呼号" prop="callsign"/>
                    <el-table-column label="CID">
                        <template #default="scope">
                            {{ formatCid(scope.row.cid) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="登录权限">
                        <template #default="scope">
                            <el-tag class="border-none"
                                    :color="config.ratings[scope.row.rating + 1].color"
                                    effect="dark">
                                {{ config.ratings[scope.row.rating + 1].label }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="席位">
                        <template #default="scope">
                            <el-tag class="border-none"
                                    :color="config.facilities[scope.row.facility]"
                                    effect="dark">
                                {{ serverConfigStore.facilities[scope.row.facility].short_name }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="频率">
                        <template #default="scope">
                            {{ (scope.row.frequency / 1000).toFixed(3) }}
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.online-enter-from,
.online-leave-to {
    opacity: 0;
    transform: translateY(-100px);
}

.online-enter-active,
.online-leave-active {
    transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
}

.online-enter-to,
.online-leave-from {
    opacity: 1;
    transform: translateY(0);
}

.left-box,
.right-box,
.data-table {
    background-color: var(--el-bg-color-overlay);
    border-radius: 20px;
}

.left-box {
    position: absolute;
    left: .5em;
    bottom: .5em;
    width: 33%;
    height: 33%;
    backdrop-filter: blur(10px);
    background-image: linear-gradient(45deg, rgba(66, 60, 90, 0.15), rgba(66, 60, 90, 0.15));
}

.right-box {
    position: absolute;
    right: .5em;
    bottom: .5em;
    width: 33%;
    height: 33%;
    backdrop-filter: blur(10px);
    background-image: linear-gradient(45deg, rgba(66, 60, 90, 0.15), rgba(66, 60, 90, 0.15));
}

.ol-tab-show {
    padding: 10px;
    border-radius: 20px;
}

.ol-tab-show:hover {
    backdrop-filter: blur(10px);
    background-image: linear-gradient(45deg, rgba(66, 60, 90, 0.15), rgba(66, 60, 90, 0.15));
}

.ol-tab {
    position: absolute;
    bottom: .5em;
    width: 100%;
    display: flex;
    justify-content: center;
}

.map-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
}

.map-container {
    width: 100%;
    height: 100%;
}

.map-selector {
    border-radius: 20px;
    padding: 10px;
}

.map-selector:hover {
    backdrop-filter: blur(10px);
    background-image: linear-gradient(45deg, rgba(66, 60, 90, 0.15), rgba(66, 60, 90, 0.15));

    .el-radio {
        color: white;
    }
}

.el-radio-group {
    flex-direction: column;
    align-items: flex-start;

    .el-radio {
        margin: 0;
    }
}

.ol-switch {
    position: absolute;
    top: .5em;
    left: .5em;
}

.ol-popup {
    background-color: var(--el-bg-color-overlay);
    position: absolute;
    padding: 15px;
    border-radius: 10px;
    border: 1px solid #ccc;
    min-width: 200px;
    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.3);
}

.ol-popup-closer {
    position: absolute;
    top: 5px;
    right: 5px;
    text-decoration: none;
    color: #333;
    font-size: 1.2em;
}
</style>