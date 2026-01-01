<script setup lang="ts">
import {computed, ComputedRef, onMounted, onUnmounted, ref, Ref, watch, watchEffect} from 'vue';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {fromLonLat} from 'ol/proj';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
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
import {Source, XYZ} from "ol/source.js";
import {Cloudy, Expand} from "@element-plus/icons-vue";
import {formatCid} from "@/utils/utils.js";
import {useServerConfigStore} from "@/store/server_config.js";
import {useToggle} from "@vueuse/core";
import ApiClient from "@/api/client.js";
import {useUserStore} from "@/store/user.js";
import AxiosXHR = Axios.AxiosXHR;
import moment from "moment";
import {padStart} from "lodash-es";

import * as echarts from 'echarts/core';
import {
    TitleComponentOption,
    TooltipComponent,
    TooltipComponentOption,
    GridComponent,
    GridComponentOption,
    DataZoomComponent,
    DataZoomComponentOption
} from 'echarts/components';
import {LineChart, LineSeriesOption} from 'echarts/charts';
import {CanvasRenderer} from 'echarts/renderers';
import {EChartsType} from "echarts/core";

echarts.use([TooltipComponent, GridComponent, DataZoomComponent, LineChart, CanvasRenderer]);

type EChartsOption = echarts.ComposeOption<TitleComponentOption | TooltipComponentOption | GridComponentOption | DataZoomComponentOption | LineSeriesOption>;

const chartDom = ref<HTMLDivElement>();
const myChart: ComputedRef<Nullable<EChartsType>> = computed(() => {
    if (chartDom.value) {
        return echarts.init(chartDom.value)
    }
    return null;
});
let option: EChartsOption;

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
let fssLayer: Layer;
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
    feature.set('online_time', pilot.logon_time);
    feature.set('heading', pilot.heading);
    feature.set("real_name", pilot.real_name);
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
    feature.set("facility", controller.facility);
    feature.set("rating", controller.rating);
    feature.set("online_time", controller.logon_time);
    feature.set("real_name", controller.real_name);
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
                transponder: pilot.transponder,
                online_time: pilot.logon_time,
                heading: pilot.heading,
                real_name: pilot.real_name
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
                source = fssLayer.getSource();
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
                cid: formatCid(controller.cid),
                online_time: controller.logon_time,
                rating: controller.rating,
                facility: controller.facility,
                real_name: controller.real_name
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

    [fssLayer, centerLayer, approachLayer, towerLayer].forEach(layer => {
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
const showPilotDetail = ref(false);
const showATCDetail = ref(false);
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
        source: new VectorSource()
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

    fssLayer = new VectorLayer({
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

    map.value.addLayer(fssLayer);
    map.value.addLayer(centerLayer);
    map.value.addLayer(approachLayer);
    map.value.addLayer(weatherLayer);
    map.value.addLayer(lineLayer);
    map.value.addLayer(aircraftLayer);
    map.value.addLayer(towerLayer);
    // map.value.addLayer(imageLayer);

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

    const time = pointsData.map(point => moment.unix(point.timestamp).format("HH:mm:ss"));
    const height = pointsData.map(point => point.altitude);
    const speed = pointsData.map(point => point.ground_speed);

    option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {type: 'cross', animation: false, label: {backgroundColor: '#505765'}},
            formatter: function (params: any) {
                return params[0].axisValueLabel + '<br/>' + params[0].marker + params[0].seriesName + ': ' + params[0].data + ' ft<br/>' + params[1].marker + params[1].seriesName + ': ' + params[1].data + ' kts';
            }
        },
        grid: {top: '50'},
        xAxis: [{type: 'category', boundaryGap: false, axisLine: {onZero: false}, data: time}],
        yAxis: [{type: 'value', name: '高度(ft)'}, {type: 'value', name: "地速(kts)"}],
        dataZoom: [{show: true, realtime: true}, {type: 'inside', realtime: true}],
        series: [
            {type: 'line', name: '高度', yAxisIndex: 0, symbolSize: 0, data: height},
            {type: 'line', name: "地速", yAxisIndex: 1, symbolSize: 0, data: speed}
        ]
    };
    myChart.value?.setOption(option);

    const coordinates = pointsData.map(point =>
        fromLonLat([point.longitude, point.latitude])
    );

    // 创建线段特征，根据高度设置颜色
    const lineString = new LineString(coordinates);
    lineFeature = new Feature({
        geometry: lineString
    });

    // 为线段设置样式函数，根据高度变化颜色
    lineFeature.setStyle((feature, _) => {
        // 获取线段的坐标点
        const geometry = feature.getGeometry();
        if (geometry instanceof LineString) {
            const coordinates = geometry.getCoordinates();
            const styles = [];

            // 为每一段线段设置颜色，颜色基于高度变化
            for (let i = 0; i < coordinates.length - 1; i++) {
                const startCoord = coordinates[i];
                const endCoord = coordinates[i + 1];

                // 获取对应点的高度
                const startAltitude = pointsData[i]?.altitude || 0;

                // 计算颜色（基于高度）
                const startColor = altitudeToColor(startAltitude);

                // 创建线段样式
                const segmentStyle = new Style({
                    geometry: new LineString([startCoord, endCoord]),
                    stroke: new Stroke({
                        color: startColor,
                        width: 3
                    })
                });

                styles.push(segmentStyle);
            }

            return styles;
        }

        // 默认样式
        return new Style({
            stroke: new Stroke({
                color: config.flight_path_color,
                width: 3
            })
        });
    });

    lineLayer.getSource().addFeature(lineFeature);
}

const minAltitude = config.flight_path_min_altitude;
const altitudeDiff = config.flight_path_max_altitude - minAltitude;

const altitudeToColor = (altitude: number) => {
    const ratio = Math.max(0, Math.min(1, (altitude - minAltitude) / altitudeDiff));

    const diff = Math.abs(config.flight_path_color_end - config.flight_path_color_start);
    let hue: number
    if (config.flight_path_color_reverse) {
        hue = config.flight_path_color_end - diff * ratio;
    } else {
        hue = config.flight_path_color_start + diff * ratio;
    }
    const saturation = 80; // 保持较高饱和度
    const lightness = 50; // 适中的亮度

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const removeLine = () => {
    if (lineFeature == null) {
        return
    }

    lineLayer.getSource().clear();
    lineFeature = null;
}

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
            showPopup(feature);
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

type PilotData = {
    callsign: string,
    cid: string,
    heading: number,
    groundSpeed: number,
    altitude: number,
    transponder: string,
    online_time: string,
    real_name: string,
    home_airport: string,
    flightPlan: Nullable<FlightPlanModel>
}
const pilotData: Ref<PilotData> = ref({
    callsign: 'CES2352',
    cid: '2352',
    flightPlan: null,
    groundSpeed: 0,
    altitude: 0,
    transponder: '2000',
    heading: 0,
    real_name: '',
    home_airport: 'ZGHA'
});
type ATCData = {
    callsign: string,
    frequyency: string,
    cid: string,
    infos: string[],
    online_time: string,
    is_break: boolean,
    offline_time: string,
    login_rating: string,
    login_facility: string,
    real_name: string
}
const atcData: Ref<ATCData> = ref({
    callsign: '',
    frequyency: '',
    cid: '',
    infos: [],
    online_time: '',
    is_break: false,
    offline_time: '',
    login_rating: '',
    login_facility: '',
    real_name: ''
});

// 显示弹出框
const showPopup = (feature: Feature) => {
    const isPilot = feature.get("isPilot");
    if (isPilot == undefined) {
        return;
    }

    if (isPilot) {
        pilotData.value.callsign = feature.get('callsign') as string;
        pilotData.value.cid = feature.get('cid') as string;
        pilotData.value.groundSpeed = feature.get('groundSpeed') as number;
        pilotData.value.altitude = feature.get('altitude') as number;
        pilotData.value.transponder = feature.get('transponder') as string;
        pilotData.value.flightPlan = feature.get('flightPlan') as Nullable<FlightPlanModel>;
        pilotData.value.online_time = moment.utc(feature.get("online_time") as string).local().format("YYYY-MM-DD HH:mm:ss");
        pilotData.value.heading = feature.get('heading') as number;
        const infos = (feature.get("real_name") as string).split(" ");
        if (infos.length == 1) {
            pilotData.value.real_name = infos[0];
            pilotData.value.home_airport = '未提供';
        } else {
            pilotData.value.real_name = infos.slice(0, infos.length - 1).join(" ");
            pilotData.value.home_airport = infos[infos.length - 1];
        }
        showATCDetail.value = false;
        showPilotDetail.value = true;
    } else {
        removeLine();
        atcData.value.callsign = feature.get('callsign') as string;
        atcData.value.frequyency = (Number(feature.get('frequency')) / 1000).toFixed(3);
        atcData.value.cid = feature.get('cid') as string;
        atcData.value.infos = feature.get('atis') as string[];
        atcData.value.online_time = moment.utc(feature.get("online_time") as string).local().format("YYYY-MM-DD HH:mm:ss");
        atcData.value.is_break = feature.get("is_break") as boolean;
        let offlineTime = feature.get("offline_time") as string;
        if (offlineTime == "") {
            atcData.value.offline_time = "未提供预计下线时间";
        } else {
            offlineTime = padStart(offlineTime, 4, "0");
            const time = moment.utc({
                hour: parseInt(offlineTime.substring(0, 2)),
                minute: parseInt(offlineTime.substring(2))
            });
            atcData.value.offline_time = time.local().format("YYYY-MM-DD HH:mm:ss");
        }
        atcData.value.login_rating = config.ratings[feature.get("rating") as number + 1].label;
        atcData.value.login_facility = serverConfigStore.facilities[feature.get("facility") as number].short_name;
        atcData.value.real_name = feature.get('real_name') as string;
        showPilotDetail.value = false;
        showATCDetail.value = true;
    }
};

// 关闭弹出框
const closePopup = () => {
    showPilotDetail.value = false;
    showATCDetail.value = false;
    removeLine();
};

// 组件卸载时清理
onUnmounted(() => {
    if (map.value) {
        map.value.setTarget(undefined);
        map.value = null;
    }
    if (myChart.value) {
        myChart.value.dispose();
    }
    clearInterval(interval);
});

const pilotRowClick = async (data: OnlinePilotModel) => {
    map.value?.getView().animate({
        center: fromLonLat([data.longitude, data.latitude]),
        zoom: 8,
        duration: 1000
    });
    pilotData.value.callsign = data.callsign;
    pilotData.value.cid = formatCid(data.cid);
    pilotData.value.groundSpeed = data.ground_speed;
    pilotData.value.altitude = data.altitude;
    pilotData.value.transponder = data.transponder;
    pilotData.value.flightPlan = data.flight_plan;
    pilotData.value.online_time = moment.utc(data.logon_time).local().format("YYYY-MM-DD HH:mm:ss");
    pilotData.value.heading = data.heading;
    const infos = data.real_name.split(" ");
    if (infos.length == 1) {
        pilotData.value.real_name = infos[0];
        pilotData.value.home_airport = '未提供';
    } else {
        pilotData.value.real_name = infos.slice(0, infos.length - 1).join(" ");
        pilotData.value.home_airport = infos[infos.length - 1];
    }
    showPilotDetail.value = true;
    showATCDetail.value = false;
    await drawLine(data.callsign);
}

const atcRowClick = (data: OnlineControllerModel) => {
    removeLine();
    let zoom: number;
    switch (data.facility) {
        case 1:
            zoom = 4;
            break;
        case 6:
            zoom = 6;
            break;
        case 5:
            zoom = 8;
            break;
        case 4:
        case 3:
        case 2:
            zoom = 10;
            break;
        default:
            zoom = 8;
    }
    map.value?.getView().animate({
        center: fromLonLat([data.longitude, data.latitude]),
        zoom: zoom,
        duration: 1000
    });
    atcData.value.callsign = data.callsign;
    atcData.value.frequyency = (data.frequency / 1000).toFixed(3);
    atcData.value.cid = formatCid(data.cid);
    atcData.value.infos = data.atc_info;
    atcData.value.online_time = moment.utc(data.logon_time).local().format("YYYY-MM-DD HH:mm:ss");
    atcData.value.is_break = data.is_break;
    let offlineTime = data.offline_time;
    if (offlineTime == "") {
        atcData.value.offline_time = "未提供预计下线时间";
    } else {
        offlineTime = padStart(offlineTime, 4, "0");
        const time = moment.utc({
            hour: parseInt(offlineTime.substring(0, 2)),
            minute: parseInt(offlineTime.substring(2))
        });
        atcData.value.offline_time = time.local().format("YYYY-MM-DD HH:mm:ss");
    }
    atcData.value.login_rating = config.ratings[data.rating + 1].label;
    atcData.value.login_facility = serverConfigStore.facilities[data.facility].short_name;
    atcData.value.real_name = data.real_name;
    showPilotDetail.value = false;
    showATCDetail.value = true;
}
</script>

<template>
    <div class="map-wrapper">
        <div ref="mapContainer" id="map" class="map-container"></div>
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
                <el-table :data="onlinePilotList" height="100%" class="data-table" @row-click="pilotRowClick">
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
                <el-table :data="onlineControllerList" height="100%" class="data-table" @row-click="atcRowClick">
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
        <Transition name="detail">
            <div class="detail-form" v-if="showPilotDetail">
                <div class="base-info">
                    <span class="callsign">{{ pilotData.callsign }}</span>
                    <div class="info-item">
                        <span class="label">飞行员:</span>
                        <span class="value">{{ pilotData.cid }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">名称:</span>
                        <span class="value">{{ pilotData.real_name }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">基地机场:</span>
                        <span class="value">{{ pilotData.home_airport }}</span>
                    </div>
                    <div class="info-item" v-if="pilotData.flightPlan != null">
                        <span class="label">执飞机型:</span>
                        <span class="value">{{ pilotData.flightPlan.aircraft.split("-")[0] }}</span>
                    </div>
                </div>
                <div class="flight-plan-info">
                    <div class="info-item error" v-if="pilotData.flightPlan == null">
                        <span class="title">未找到飞行计划, 请提交飞行计划</span>
                        <span class="value">平等的看不起任何不交计划的人</span>
                    </div>
                    <div v-else>
                        <div class="info-item">
                            <span class="label">离场机场:</span>
                            <span class="value">{{ pilotData.flightPlan?.departure }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">到达机场:</span>
                            <span class="value">{{ pilotData.flightPlan?.arrival }}</span>
                        </div>
                        <div class="info-item">
                            <span class="label">备降场:</span>
                            <span class="value">{{
                                    pilotData.flightPlan?.alternate == '' ? '无' : pilotData.flightPlan?.alternate
                                }}</span>
                        </div>
                        <div class="info-item route">
                            <span class="label">航路:</span>
                            <span class="value">{{ pilotData.flightPlan?.route }}</span>
                        </div>
                        <div class="info-item route">
                            <span class="label">备注:</span>
                            <span class="value">{{ pilotData.flightPlan?.remarks }}</span>
                        </div>
                    </div>
                    <div class="info-item">
                        <span class="label">地速:</span>
                        <span class="value">{{ pilotData.groundSpeed }} kts</span>
                    </div>
                    <div class="info-item">
                        <span class="label">高度:</span>
                        <span class="value">{{ pilotData.altitude }} ft</span>
                    </div>
                    <div class="info-item">
                        <span class="label">朝向:</span>
                        <span class="value">{{ pilotData.heading }}°</span>
                    </div>
                    <div class="info-item">
                        <span class="label">应答机:</span>
                        <span class="value"
                              :class="{'color-red': pilotData.transponder == '7700' || pilotData.transponder == '7600' || pilotData.transponder == '7500'}">
                            {{ pilotData.transponder }}
                        </span>
                    </div>
                </div>
                <div class="extra-info">
                    <div class="info-item">
                        <span class="label">上线时间:</span>
                        <span class="value">{{ pilotData.online_time }}</span>
                    </div>
                </div>
                <div ref="chartDom" style="width: 100%;height: 300px"/>
            </div>
            <div class="detail-form" v-else-if="showATCDetail">
                <div class="base-info">
                    <span class="callsign">{{ atcData.callsign }}</span>
                    <span v-if="atcData.is_break">🔴</span>
                    <span v-else>🟢</span>
                    <div class="info-item">
                        <span class="label">频率:</span>
                        <span class="value">{{ atcData.frequyency }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">管制员:</span>
                        <span class="value">{{ atcData.cid }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">名称:</span>
                        <span class="value">{{ atcData.real_name }}</span>
                    </div>
                </div>
                <div class="atc-info">
                    <p class="label">ATC INFO:</p>
                    <p class="value" v-for="item in atcData.infos">
                        {{ item }}
                    </p>
                </div>
                <div class="extra-info">
                    <div class="info-item">
                        <span class="label">上线时间:</span>
                        <span class="value">{{ atcData.online_time }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">预计下线时间:</span>
                        <span class="value">{{ atcData.offline_time }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">登录权限:</span>
                        <span class="value">{{ atcData.login_rating }}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">席位:</span>
                        <span class="value">{{ atcData.login_facility }}</span>
                    </div>
                </div>
            </div>
            <div v-else/>
        </Transition>
    </div>
</template>

<style scoped>
.detail-form {
    position: absolute;
    top: 4em;
    right: .5em;
    width: 300px;
    background-color: var(--el-bg-color-overlay);
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid var(--el-border-color-light);
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    max-height: 500px;
    overflow-y: auto;
}

.detail-form .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
}

.detail-form .info-item:last-child {
    margin-bottom: 0;
}

.detail-form .label {
    color: var(--el-text-color-secondary);
    font-weight: 500;
    min-width: 70px;
    text-align: left;
}

.detail-form .value {
    color: var(--el-text-color-primary);
    font-weight: 600;
    text-align: right;
    flex: 1;
    word-break: break-all;
}

.base-info, .flight-plan-info, .extra-info, .atc-info {
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.base-info:last-child, .flight-plan-info:last-child, .extra-info:last-child, .atc-info:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
}

.route {
    display: flex;
    flex-direction: column;

    .value {
        text-align: left;
    }
}

.error {
    display: flex;
    flex-direction: column;

    .title, .value {
        margin: 0;
        text-align: left;
    }

    .title {
        color: #ff7365;
    }

    .value {
        color: var(--el-bg-color-overlay);
    }

    .value:hover {
        color: var(--el-text-color-primary);
    }
}

.callsign {
    font-size: 1.25rem;
    font-weight: bold;
}

.atc-info .value {
    text-align: left;
}

.detail-enter-from,
.detail-leave-to {
    opacity: 0;
    transform: translateZ(-100px);
}

.detail-enter-active,
.detail-leave-active {
    transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
}

.detail-enter-to,
.detail-leave-from {
    opacity: 1;
    transform: translateZ(0);
}

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
</style>