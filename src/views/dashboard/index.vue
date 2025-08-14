<template>
	<div>
		<!-- 雷达列表和监测点列表 -->
		<div v-show="radarList.length > 0" style="position: absolute; top: 94px; right: 0px; z-index: 10; background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 5px; max-height: 80vh; overflow-y: auto; color: white">
			<!-- 雷达列表 -->
			<div>
				<h3>雷达列表</h3>
				<ul style="list-style: none; padding: 0; margin: 0">
					<li v-for="radar in radarList" :key="radar.radarId" @click="selectRadar(radar)" :style="getRadarItemStyle(radar)">
						{{ radar.radarName }}
					</li>
				</ul>
			</div>

			<!-- 监测点列表 -->
			<div v-if="selectedRadar" style="margin-top: 10px">
				<h3>监测点列表</h3>
				<ul v-if="filteredPoints.length > 0" style="list-style: none; padding: 0; margin: 0">
					<li
						v-for="point in filteredPoints"
						:key="point.id"
						@click="selectPoint(point)"
						:style="{
							cursor: 'pointer',
							padding: '5px',
							backgroundColor: selectedPoint && selectedPoint.id === point.id ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
							color: 'white'
						}"
					>
						{{ point.pointName }}
					</li>
				</ul>
				<div v-else style="padding: 5px; color: white">该雷达没有监测点信息</div>
			</div>
		</div>

		<div class="deformationContainer" style="position: absolute; bottom: 0; right: 0; width: 100%; z-index: 8">
			<DeformationLineChart class="deformation" :imageData="chartData" :pointIndex="currentPointIndex" :radarName="currentRadarName" v-show="timerIdForDeformationData != null"></DeformationLineChart>
			<div v-show="timerIdForDeformationData != null" style="display: flex; align-items: center; margin-bottom: 10px">
				<label style="color: #fff">开始时间:</label>
				<input type="datetime-local" v-model="startTime" style="margin-right: 20px" />
				<label style="color: #fff">结束时间:</label>
				<input type="datetime-local" v-model="endTime" style="margin-right: 20px" />
				<!--button @click="updateChartData" style="padding: 5px 10px;">更新图表</button-->
			</div>
		</div>
		<div id="map-container" class="map" ref="cesiumContainer" style="width: 100%">
			<div v-if="loading" class="loading-overlay">正在加载中，请稍候...</div>
			<!-- 鼠标位置显示 -->
			<div v-show="timerIdForDeformationData == null" class="mouse-position" style="position: absolute; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.5); color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; z-index: 100">
				经度: {{ mousePosition.longitude.toFixed(6) }} 纬度:
				{{ mousePosition.latitude.toFixed(6) }}
			</div>
		</div>
		<!-- 雷达告警对话框 -->
		<RadarAlarmDialog :visible.sync="showAlarmDialog" :radarInfo="selectedRadarForAlarm" />
	</div>
</template>

<script>
//import Cesium from './Cesium/Cesium'
//import './Cesium/Widgets/widgets.css'
import { getRadarPointDeformData, listDeptRadarPoint } from "@/api/admin/radar-point";
import { getRadarsAlarms, listSysRadar } from "@/api/admin/sys-radar";
import loadjs from "loadjs";
import DeformationLineChart from "./radar/DeformationLineChart.vue";
import RadarAlarmDialog from "./radar/RadarAlarmDialog.vue";

const radarPrefix = "radar_";
const radarPointPrefix = "radarpt_";
const pointPrefix = "point_";
const indexPrefix = "index_";

export default {
	name: "Dashboard",
	components: {
		DeformationLineChart,
		RadarAlarmDialog
	},
	data() {
		return {
			loading: true,
			viewer: null,
			timerIdForRadar: null,
			timerIdForPoint: null,
			timerIdForDeformation: null,
			timerIdForDeformationData: null,
			timerIdForBlinking: null, // 告警闪烁定时器
			chartData: [],
			currentPointIndex: null,
			currentRadarName: "",
			startTime: "2025-01-10 04:00:00",
			endTime: "2025-12-12 04:00:00",
			selectedRadarPoint: null,
			// 雷达和监测点列表相关数据
			radarList: [],
			pointList: [],
			selectedRadar: null,
			selectedPoint: null,
			// 告警相关数据
			alarmRadarIds: new Set(), // 存储有告警的雷达ID
			blinkState: false, // 闪烁状态
			// 告警对话框相关
			showAlarmDialog: false, // 控制告警对话框显示
			selectedRadarForAlarm: null, // 存储选中雷达的告警信息
			// 鼠标位置
			mousePosition: {
				longitude: 0,
				latitude: 0
			}
		};
	},
	computed: {
		// 计算属性：过滤当前雷达的监测点
		filteredPoints() {
			if (!this.selectedRadar) {
				return [];
			}
			return this.pointList.filter(point => point.radarId === this.selectedRadar.radarId);
		}
	},
	created() {
		console.log("Dashboard created.");
	},
	mounted() {
		// console.log("Cesium:", Cesium);
		console.log("mounted.执行mountd:", process.env.BASE_URL);
		loadjs(["/Cesium/Cesium.js"], () => {
			// loadjs([process.env.BASE_URL + '/Cesium/Cesium.js'], () => {
			console.log("loadjs finished.");
			// console.log("Cesium end:", Cesium);
			this.init();

			// 添加窗口大小变化事件监听器
			window.addEventListener("resize", () => {
				this.viewer.resize();
			});
			this.viewer.resize();

			// 添加鼠标移动事件监听器
			this.viewer.screenSpaceEventHandler.setInputAction(movement => {
				// 检查场景当前是否正在切换模式（例如2D/3D切换），避免在过渡状态中执行操作
				if (this.viewer.scene.mode !== Cesium.SceneMode.MORPHING) {
					console.log("鼠标"); // 调试信息，记录鼠标移动事件
					// 根据鼠标当前位置创建一条从相机穿过屏幕像素的射线
					const ray = this.viewer.camera.getPickRay(movement.endPosition);
					// 检测射线与地球表面的交点（地形/椭球体）
					const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
					// 如果存在有效交点（即鼠标在地球表面上方）
					if (cartesian) {
						// 将笛卡尔坐标系坐标转换为地理坐标（经度/纬度/高度）
						const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
						// 更新当前位置数据（弧度转角度）
						this.mousePosition.longitude = Cesium.Math.toDegrees(cartographic.longitude);
						this.mousePosition.latitude = Cesium.Math.toDegrees(cartographic.latitude);
					}
				}
			}, Cesium.ScreenSpaceEventType.MOUSE_MOVE); // 指定监听的事件类型为鼠标移动
		});
		this.testGetRadarPointDeformData();
	},

	destroyed() {
		console.error("destroyed");
		// 停止告警雷达闪烁定时器
		this.stopBlinkingTimer();
	},
	activated() {
		console.error("Dashboard destroyed");
		this.$nextTick(() => {
			if (this.viewer) {
				console.log("this.viewer.canvas=", this.viewer.canvas);
				this.resizeCanvas();
			}
		});
	},
	methods: {
		// 格式化时间，将本地时间转换为UTC时间
		formatDateTime(dateTime) {
			if (!dateTime) return "";
			// 如果包含T，说明是datetime-local的值，需要转换为Date对象
			if (dateTime.includes("T")) {
				// 先将datetime-local的值转换为本地时间的Date对象
				const localDate = new Date(dateTime.replace("T", " ") + ":00");
				// 转换为UTC时间字符串
				return localDate.toISOString().slice(0, 19).replace("T", " ");
			} else {
				// 如果已经是标准格式，直接转换为UTC时间
				const localDate = new Date(dateTime);
				return localDate.toISOString().slice(0, 19).replace("T", " ");
			}
		},
		// 获取雷达列表项的样式
		getRadarItemStyle(radar) {
			let backgroundColor = "transparent";
			let color = "white";

			// 如果是选中的雷达
			if (this.selectedRadar && this.selectedRadar.radarId === radar.radarId) {
				backgroundColor = "rgba(255, 255, 255, 0.3)";
				if (this.alarmRadarIds.has(radar.radarId)) {
					if (this.blinkState) {
						color = "red";
					}
				}
			}
			// 如果雷达有告警且当前处于闪烁状态
			else if (this.alarmRadarIds.has(radar.radarId) && this.blinkState) {
				backgroundColor = "#dd000055"; // 红色背景
				color = "red";
			}

			return {
				cursor: "pointer",
				padding: "5px",
				backgroundColor: backgroundColor,
				color: color
			};
		},
		//
		resizeCanvas() {
			this.viewer.canvas.style.width = "100%";
			this.viewer.canvas.style.height = "100vh";
			this.viewer.resize(); // 确保调用 resize 方法来更新视图大小
		},

		//TODO:测试：获取变形点数据
		async testGetRadarPointDeformData() {
			let resp = await getRadarPointDeformData({
				devid: 20,
				index: 3,
				startTime: this.formatDateTime(this.startTime),
				endTime: this.formatDateTime(this.endTime)
			});
			console.log("测试：获取变形点数据:", resp);
		},

		// 启动定时器获取雷达信息
		startRadarTimer() {
			let that = this;
			this.timerIdForRadar = setTimeout(() => {
				//console.log("Timer executed");
				listSysRadar(
					this.addDateRange({
						pageIndex: 1,
						pageSize: 1000,
						radarId: undefined,
						radarName: undefined,
						radarKey: undefined,
						specialKey: undefined,
						deptId: undefined
					})
				)
					.then(res => {
						console.log("listSysRadar res=", res);
						that.updateRadars(res.data.list);

						//成功获取雷达信息后再获取监测点
						that.startPointTimer();
						that.startAlarmsTimer();
						that.startDeformationTimer();
					})
					.catch(e => {
						console.log("listSysRadar err=", e);
						that.startRadarTimer(res.data.list);
					});
			}, 1000);
		},
		// 启动定时器获取监测点信息
		startPointTimer() {
			let that = this;
			this.timerIdForPoint = setTimeout(() => {
				//console.log("Timer executed");
				let radarids = this.radarList.map(item => item.radarId);
				listDeptRadarPoint()
					.then(res => {
						console.log("listDeptRadarPoint res=", res);
						that.updateRadarPoints(res.data.list);
					})
					.catch(e => {
						console.log("listDeptRadarPoint err=", e);
						that.startPointTimer();
					});
			}, 1000);
		},
		// 启动定时器获取告警信息
		startAlarmsTimer() {
			//TODO:关闭定时查询
			// let that = this;
			// this.timerIdForAlarms = setTimeout(() => {
			// 	//console.log("Timer executed");
			// 	getRadarsAlarms()
			// 		.then(res => {
			// 			console.log('getRadarsAlarms res=', res);
			// 			// 更新告警雷达ID集合
			// 			that.alarmRadarIds.clear();
			// 			if (res.data && Array.isArray(res.data)) {
			// 				res.data.forEach(item => {
			// 					that.alarmRadarIds.add(item.RadarId);
			// 				});
			// 			}
			// 			// 启动闪烁定时器
			// 			that.startBlinkingTimer();
			// 		})
			// 		.catch(e => {
			// 			console.log('getRadarsAlarms err=', e);
			// 		})
			// 		.finally(() => {
			// 			that.startAlarmsTimer();
			// 		});
			// }, 1000);
		},
		// 启动变形数据定时器
		startDeformationTimer() {
			let that = this;
			this.timerIdForDeformation = setTimeout(() => {
				//console.log("Timer executed");
				// listDeptRadarPointDeformationData().then(res=>{
				//     console.log('listDeptRadarPointDeformationData res=',res)
				//   })
				that.startDeformationTimer();
			}, 1000);
		},
		// 启动告警雷达闪烁定时器
		startBlinkingTimer() {
			// 如果已经存在闪烁定时器，先清除
			if (this.timerIdForBlinking) {
				clearInterval(this.timerIdForBlinking);
				this.timerIdForBlinking = null;
			}

			// 每500毫秒切换一次闪烁状态
			this.timerIdForBlinking = setInterval(() => {
				this.blinkState = !this.blinkState;
				// 强制更新DOM
				this.$forceUpdate();
			}, 500);
		},
		// 停止告警雷达闪烁定时器
		stopBlinkingTimer() {
			if (this.timerIdForBlinking) {
				clearInterval(this.timerIdForBlinking);
				this.timerIdForBlinking = null;
			}
		},
		// 启动定时器获取变形数据
		startDeformationDataTimer(ids) {
			// 保存当前ids对象
			this.currentIds = ids;
			// 设置当前监测点下标
			this.currentPointIndex = ids.index;
			// 获取雷达实体并设置雷达名称
			const radarEntity = this.getRadarEntity(ids.radarId);
			if (radarEntity && radarEntity.name) {
				this.currentRadarName = radarEntity.name;
			} else {
				this.currentRadarName = "未知雷达";
			}
			// 清除之前的定时器
			if (this.timerIdForDeformationData) {
				clearInterval(this.timerIdForDeformationData);
			}
			let that = this;
			// 启动新的定时器，每秒调用一次
			this.timerIdForDeformationData = setInterval(() => {
				that.updateChartData();
			}, 1000);
		},

		// 更新图表数据的方法
		updateChartData() {
			let that = this;
			// 检查是否有当前的ids对象
			if (this.currentIds) {
				// 调用getRadarPointDeformData函数并传递选择的时间参数
				getRadarPointDeformData({
					devid: this.currentIds.radarId,
					index: this.currentIds.index,
					startTime: this.formatDateTime(this.startTime),
					endTime: this.formatDateTime(this.endTime)
				})
					.then(res => {
						console.log("getRadarPointDeformData res=", res);
						if (res.code === 200 && res.data && res.data.length > 0) {
							// 处理数据并更新图表
							let chartData = res.data.map(item => ({
								SvrTime: new Date(item.SvrTime).getTime(),
								Deformation: item.Deformation
							}));
							//console.log('chartData=', chartData);
							// 更新DeformationLineChart组件的数据
							that.chartData = chartData;
						} else {
							//   that.stopUpdateChartData();
							that.chartData = [];
						}
					})
					.catch(err => {
						console.error("getRadarPointDeformData error:", err);
					});
			}
		},

		// 停止更新图表数据
		stopUpdateChartData() {
			console.log("stopUpdateChartData this.timerIdForDeformationData=", this.timerIdForDeformationData);
			if (this.timerIdForDeformationData) {
				clearInterval(this.timerIdForDeformationData);
				this.timerIdForDeformationData = null;
			}
		},

		// 获取雷达和监测点实体的ID
		getRadarEntityID(radarId) {
			return radarPrefix + radarId;
		},

		// 获取雷达监测点实体的ID
		getRadarPointEntityID(radarId, id, index) {
			return radarPointPrefix + radarId + pointPrefix + id + indexPrefix + index;
		},

		// 从监测点实体ID中提取雷达ID、监测点ID和索引
		getRadarIDFromPointEntityID(pointEntId) {
			// 从 'radar_'+radarId+'point_'+id+'index_'+index 格式中提取 radarId, id, index
			if (!pointEntId) return undefined;

			const radarStartIndex = radarPointPrefix.length;
			const pointStartIndex = pointEntId.indexOf(pointPrefix);
			const indexStartIndex = pointEntId.indexOf(indexPrefix);

			if (pointStartIndex === -1 || indexStartIndex === -1) return undefined;

			const radarId = pointEntId.substring(radarStartIndex, pointStartIndex);
			const id = pointEntId.substring(pointStartIndex + pointPrefix.length, indexStartIndex);
			const index = pointEntId.substring(indexStartIndex + indexPrefix.length);

			return { radarId: Number(radarId), id: Number(id), index: Number(index) };
		},

		// 获取雷达实体
		getRadarEntity(radarId) {
			if (!this.viewer) return;
			let entid = this.getRadarEntityID(radarId);
			return this.viewer.entities.getById(entid);
		},

		// 根据ID获取实体
		getEntityById(id) {
			if (!this.viewer) return;
			return this.viewer.entities.getById(id);
		},

		// 更新雷达列表数据
		updateRadars(radars) {
			// 更新雷达列表数据
			this.radarList = radars;

			// 清除现有的雷达点实体
			if (this.viewer && this.viewer.entities) {
				// 过滤出雷达点实体并移除
				const radarEntities = this.viewer.entities.values.filter(entity => entity.id && entity.id.startsWith(radarPrefix));
				radarEntities.forEach(entity => {
					this.viewer.entities.remove(entity);
				});
			}

			// 创建新的雷达点实体
			radars.forEach(radar => {
				const entity = this.viewer.entities.add({
					id: this.getRadarEntityID(radar.radarId),
					name: radar.radarName,
					position: Cesium.Cartesian3.fromDegrees(parseFloat(radar.lng), parseFloat(radar.lat)),
					point: {
						color: Cesium.Color.RED,
						pixelSize: 10,
						outlineColor: Cesium.Color.WHITE,
						outlineWidth: 2
					},
					label: {
						text: "雷达：" + radar.radarName,
						font: "14px sans-serif",
						fillColor: Cesium.Color.WHITE,
						outlineColor: Cesium.Color.BLACK,
						outlineWidth: 2,
						style: Cesium.LabelStyle.FILL_AND_OUTLINE,
						verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
						pixelOffset: new Cesium.Cartesian2(0, -15)
					},
					description: `
                <b>雷达ID</b>: ${radar.radarId}<br/>
                <b>雷达名称</b>: ${radar.radarName}<br/>
            `
				});
			});
		},

		// 更新雷达监测点列表数据
		updateRadarPoints(points) {
			// 更新监测点列表数据
			this.pointList = points;

			if (!this.viewer) return;
			if (!points) return;
			if (points.length === undefined || points.length === 0) return;
			// 清除现有的雷达监测点实体及相关联的线和箭头
			const pointEntities = this.viewer.entities.values.filter(entity => entity.id && entity.id.startsWith(radarPointPrefix));
			pointEntities.forEach(entity => {
				// 移除关联的线和箭头实体
				if (entity.lineEntity) {
					this.viewer.entities.remove(entity.lineEntity);
				}
				if (entity.arrowEntity) {
					this.viewer.entities.remove(entity.arrowEntity);
				}
				// 移除监测点实体
				this.viewer.entities.remove(entity);
			});

			// 创建新的雷达监测点实体
			points.forEach(p => {
				let entid = this.getRadarPointEntityID(p.radarId, p.id, p.pointIndex);
				let rEntity = this.getEntityById(entid);
				if (!rEntity) {
					// 添加带 ID 和名称的圆点
					let entity = this.viewer.entities.add({
						id: entid, // 唯一标识符（程序内使用）
						name: p.pointName, // 可读名称（界面或日志中显示）
						position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat),
						point: {
							color: Cesium.Color.BLUE,
							pixelSize: 8,
							outlineColor: Cesium.Color.WHITE,
							outlineWidth: 2
						},
						label: {
							text: "监测点：" + p.pointName,
							font: "14px sans-serif",
							fillColor: Cesium.Color.WHITE,
							outlineColor: Cesium.Color.BLACK,
							outlineWidth: 2,
							style: Cesium.LabelStyle.FILL_AND_OUTLINE,
							verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
							pixelOffset: new Cesium.Cartesian2(0, -15)
						},
						description: `
                    <b>监测点编号</b>: ${p.pointKey}<br/>
                    <b>监测点名称</b>: ${p.pointName}<br/>
                    <b>RadarID</b>: ${p.radarId}
                `
					});
					let that = this;
					// 为实体添加点击事件监听器
					// 使用立即执行函数来保存ptEnt的值
					this.viewer.screenSpaceEventHandler.setInputAction(function (click) {
						let pickedObject = that.viewer.scene.pick(click.position);
						console.log("点击了:pickedObject=", pickedObject);
						if (!pickedObject || !pickedObject.id || !pickedObject.id._id) {
							that.stopUpdateChartData();
							that.chartData = [];
							that.selectedRadarPoint = null;
							return;
						}
						console.log("点击了:", pickedObject, pickedObject.id._id);
						let entIds = that.getRadarIDFromPointEntityID(pickedObject.id._id);
						if (Cesium.defined(pickedObject) && entIds) {
							console.log("点击了监测点:", entIds.radarId, entIds.id, entIds.index);
							that.selectedRadarPoint = pickedObject;
							// 显示DeformationLineChart组件
							// if (that.$refs.defValue) {
							//     that.$refs.defValue.$el.style.display = 'block';
							// } else {
							//     console.warn('defValue ref is not available when trying to display');
							// }
							// 启动定时器，每秒调用getRadarPointDeformData接口
							that.startDeformationDataTimer(entIds);
						} else {
							that.stopUpdateChartData();
							that.chartData = [];
							that.selectedRadarPoint = null;
						}
					}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

					let rEntity = this.getRadarEntity(p.radarId);
					if (rEntity) {
						//在雷达和监测点之间画一条线
						var line = this.viewer.entities.add({
							polyline: {
								positions: [rEntity.position.getValue(), entity.position.getValue()], // 起点和终点坐标
								width: 1, // 线宽（像素）
								//material: Cesium.Color.YELLOW, // 线颜色
								clampToGround: true, // 是否贴地（3D 模式下有效）
								material: new Cesium.PolylineDashMaterialProperty({
									color: Cesium.Color.YELLOW,
									dashLength: 10 // 虚线片段长度
								})
							}
						});
					}
				}
			});
		},

		// 选择雷达
		selectRadar(radar) {
			console.log("点击选择雷达:", radar);
			this.selectedRadar = radar;
			this.selectedPoint = null;

			// 检查雷达是否有告警信息
			if (this.alarmRadarIds.has(radar.radarId)) {
				// 如果有告警信息，显示告警对话框
				this.selectedRadarForAlarm = radar;
				this.showAlarmDialog = true;
			}

			// 定位到雷达位置
			if (this.viewer) {
				const position = Cesium.Cartesian3.fromDegrees(parseFloat(radar.lng), parseFloat(radar.lat), 5000);
				this.viewer.camera.flyTo({
					destination: position,
					orientation: {
						heading: Cesium.Math.toRadians(0),
						pitch: Cesium.Math.toRadians(-90),
						roll: 0
					},
					duration: 2 // 动画持续时间（秒）
				});
			}
		},

		// 选择监测点
		selectPoint(point) {
			this.selectedPoint = point;

			// 定位到监测点位置
			if (this.viewer) {
				const position = Cesium.Cartesian3.fromDegrees(parseFloat(point.lng), parseFloat(point.lat), 5000);
				this.viewer.camera.flyTo({
					destination: position,
					orientation: {
						heading: Cesium.Math.toRadians(0),
						pitch: Cesium.Math.toRadians(-90),
						roll: 0
					},
					duration: 2 // 动画持续时间（秒）
				});
			}

			// 调用startDeformationDataTimer函数
			this.startDeformationDataTimer({
				radarId: point.radarId,
				index: point.pointIndex
			});
		},

		// 初始化地图信息
		init() {
			this.loading = false;
			/*this.viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {//"map-container", {
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false, // 影像切换
        animation: true, // 是否显示动画控件
        infoBox: false, // 是否显示点击要素之后显示的信息
        selectionIndicator: false, // 要素选中框
        geocoder: false, // 是否显示地名查找控件
        timeline: false, // 是否显示时间线控件
        fullscreenButton: false,
        shouldAnimate: false,
        navigationHelpButton: false, // 是否显示帮助信息控件
      });
      this.loading = false
      this.viewer._cesiumWidget._creditContainer.style.display = "none";
      // 将三维球定位到中国
      this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 17850000),
          orientation: {
              heading :  Cesium.Math.toRadians(348.4202942851978),
              pitch : Cesium.Math.toRadians(-89.74026687972041),
              roll : Cesium.Math.toRadians(0)
          },
          complete:function callback() {
              // 定位完成之后的回调函数
          }
      });

      const TIANDITUKEY='b1682a1c63ee43a89bde5ef76566fbcd'
      // 天地图服务URL
      const tdtUrl = "http://t0.tianditu.gov.cn/img_c/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk="+TIANDITUKEY;
      
      // 创建天地图影像图层
      const tdtImagery = new Cesium.WebMapTileServiceImageryProvider({
        url: tdtUrl,
        layer: "tdtAnnoLayer", // 注意：tdtAnnoLayer是天地图注记图层，如果不需要注记请使用img_w，否则请申请注记图层的key
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible",
        subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"],
        // 请求的时候附带的token
        token: TIANDITUKEY
      });
      
      // 将天地图影像添加到Cesium Viewer中
      this.viewer.imageryLayers.addImageryProvider(tdtImagery);
      */
			let token = "0cc50ce75e61b135d4639a8068f8a7b7";
			// 服务域名
			let tdtUrl = "https://t{s}.tianditu.gov.cn/";
			// 服务负载子域
			let subdomains = ["0", "1", "2", "3", "4", "5", "6", "7"];

			// cesium 初始化
			this.viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {
				sceneMode: Cesium.SceneMode.SCENE2D, // 关键参数：强制使用二维模式
				animation: false,
				shouldAnimate: false, //是否允许动画
				selectionIndicator: false,
				baseLayerPicker: false,
				fullscreenButton: false,
				geocoder: false,
				homeButton: false,
				infoBox: false,
				sceneModePicker: false,
				timeline: false,
				navigationHelpButton: false,
				navigationInstructionsInitiallyVisible: false,
				showRenderLoopErrors: false,
				shadows: false
			});
			this.viewer._cesiumWidget._creditContainer.style.display = "none";
			this.viewer.cesiumWidget.creditContainer.style.display = "none";
			// 获取所有的图层
			let imageryLayers = this.viewer.imageryLayers;
			// 假设你知道你想要删除的图层的索引或者图层的名称
			console.log("imageLayers。。。");
			let layers = imageryLayers._layers;
			// 例如，通过名称删除图层
			for (var i = layers.length - 1; i >= 0; i--) {
				imageryLayers.remove(layers[i]);
			}

			// 抗锯齿
			this.viewer.scene.fxaa = true;
			this.viewer.scene.postProcessStages.fxaa.enabled = false;
			// 水雾特效
			//this.viewer.scene.globe.showGroundAtmosphere = true;
			// 设置最大俯仰角，[-90,0]区间内，默认为-30，单位弧度
			this.viewer.scene.screenSpaceCameraController.constrainedPitch = Cesium.Math.toRadians(-20);
			this.viewer.scene.screenSpaceCameraController.autoResetHeadingPitch = false;
			this.viewer.scene.screenSpaceCameraController.inertiaZoom = 0.5;
			this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 50;
			this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000;
			this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
			this.viewer.scene.screenSpaceCameraController.tiltEventTypes = [
				Cesium.CameraEventType.MIDDLE_DRAG,
				Cesium.CameraEventType.PINCH,
				{
					eventType: Cesium.CameraEventType.LEFT_DRAG,
					modifier: Cesium.KeyboardEventModifier.CTRL
				},
				{
					eventType: Cesium.CameraEventType.RIGHT_DRAG,
					modifier: Cesium.KeyboardEventModifier.CTRL
				}
			];
			// 取消默认的双击事件
			//this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

			// 叠加影像服务
			var imgMap = new Cesium.UrlTemplateImageryProvider({
				url: tdtUrl + "DataServer?T=img_w&x={x}&y={y}&l={z}&tk=" + token,
				subdomains: subdomains,
				tilingScheme: new Cesium.WebMercatorTilingScheme(),
				maximumLevel: 18
			});
			this.viewer.imageryLayers.addImageryProvider(imgMap);

			// 叠加国界服务
			var iboMap = new Cesium.UrlTemplateImageryProvider({
				url: tdtUrl + "DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=" + token,
				subdomains: subdomains,
				tilingScheme: new Cesium.WebMercatorTilingScheme(),
				maximumLevel: 10
			});
			this.viewer.imageryLayers.addImageryProvider(iboMap);
			/*
    // 叠加地形服务
    var terrainUrls = new Array();

    for (var i = 0; i < subdomains.length; i++){
        var url = tdtUrl.replace('{s}', subdomains[i]) + 'mapservice/swdx?T=elv_c&tk=' + token;
        terrainUrls.push(url);
    }

    var provider = new Cesium.GeoTerrainProvider({
        urls: terrainUrls
    });

    this.viewer.terrainProvider = provider;*/

			let that = this;
			// 将三维球定位到中国
			this.viewer.camera.flyTo({
				destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 17850000),
				orientation: {
					heading: Cesium.Math.toRadians(0),
					pitch: Cesium.Math.toRadians(-90),
					roll: Cesium.Math.toRadians(0)
				},

				complete: function callback() {
					// 定位完成之后的回调函数
				}
			});

			//设置定时器
			setTimeout(e => {
				this.startRadarTimer();
				that.resizeCanvas();
			}, 100);

			/*
    // 叠加三维地名服务
    var wtfs = new Cesium.GeoWTFS({
        this.viewer,
        //三维地名服务，使用wtfs服务
        subdomains:subdomains,
        metadata:{
            boundBox: {
                minX: -180,
                minY: -90,
                maxX: 180,
                maxY: 90
            },
            minLevel: 1,
            maxLevel: 20
        },
        depthTestOptimization: true,
        dTOElevation: 15000,
        dTOPitch: Cesium.Math.toRadians(-70),
        aotuCollide: true, //是否开启避让
        collisionPadding: [5, 10, 8, 5], //开启避让时，标注碰撞增加内边距，上、右、下、左
        serverFirstStyle: true, //服务端样式优先
        labelGraphics: {
            font:"28px sans-serif",
            fontSize: 28,
            fillColor:Cesium.Color.WHITE,
            scale: 0.5,
            outlineColor:Cesium.Color.BLACK,
            outlineWidth: 2,
            style:Cesium.LabelStyle.FILL_AND_OUTLINE,
            showBackground:false,
            backgroundColor:Cesium.Color.RED,
            backgroundPadding:new Cesium.Cartesian2(10, 10),
            horizontalOrigin:Cesium.HorizontalOrigin.LEFT,
            verticalOrigin:Cesium.VerticalOrigin.TOP,
            eyeOffset:Cesium.Cartesian3.ZERO,
            pixelOffset: new Cesium.Cartesian2(5, 5),
            disableDepthTestDistance:undefined
        },
        billboardGraphics: {
            horizontalOrigin:Cesium.HorizontalOrigin.CENTER,
            verticalOrigin:Cesium.VerticalOrigin.CENTER,
            eyeOffset:Cesium.Cartesian3.ZERO,
            pixelOffset:Cesium.Cartesian2.ZERO,
            alignedAxis:Cesium.Cartesian3.ZERO,
            color:Cesium.Color.WHITE,
            rotation:0,
            scale:1,
            width:18,
            height:18,
            disableDepthTestDistance:undefined
        }
    });

    //三维地名服务，使用wtfs服务
    wtfs.getTileUrl = function(){
        return tdtUrl + 'mapservice/GetTiles?lxys={z},{x},{y}&VERSION=1.0.0&tk='+ token; 
    }

    // 三维图标服务
    wtfs.getIcoUrl = function(){
        return tdtUrl + 'mapservice/GetIcon?id={id}&tk='+ token;
    }

    wtfs.initTDT([{"x":6,"y":1,"level":2,"boundBox":{"minX":90,"minY":0,"maxX":135,"maxY":45}},{"x":7,"y":1,"level":2,"boundBox":{"minX":135,"minY":0,"maxX":180,"maxY":45}},{"x":6,"y":0,"level":2,"boundBox":{"minX":90,"minY":45,"maxX":135,"maxY":90}},{"x":7,"y":0,"level":2,"boundBox":{"minX":135,"minY":45,"maxX":180,"maxY":90}},{"x":5,"y":1,"level":2,"boundBox":{"minX":45,"minY":0,"maxX":90,"maxY":45}},{"x":4,"y":1,"level":2,"boundBox":{"minX":0,"minY":0,"maxX":45,"maxY":45}},{"x":5,"y":0,"level":2,"boundBox":{"minX":45,"minY":45,"maxX":90,"maxY":90}},{"x":4,"y":0,"level":2,"boundBox":{"minX":0,"minY":45,"maxX":45,"maxY":90}},{"x":6,"y":2,"level":2,"boundBox":{"minX":90,"minY":-45,"maxX":135,"maxY":0}},{"x":6,"y":3,"level":2,"boundBox":{"minX":90,"minY":-90,"maxX":135,"maxY":-45}},{"x":7,"y":2,"level":2,"boundBox":{"minX":135,"minY":-45,"maxX":180,"maxY":0}},{"x":5,"y":2,"level":2,"boundBox":{"minX":45,"minY":-45,"maxX":90,"maxY":0}},{"x":4,"y":2,"level":2,"boundBox":{"minX":0,"minY":-45,"maxX":45,"maxY":0}},{"x":3,"y":1,"level":2,"boundBox":{"minX":-45,"minY":0,"maxX":0,"maxY":45}},{"x":3,"y":0,"level":2,"boundBox":{"minX":-45,"minY":45,"maxX":0,"maxY":90}},{"x":2,"y":0,"level":2,"boundBox":{"minX":-90,"minY":45,"maxX":-45,"maxY":90}},{"x":0,"y":1,"level":2,"boundBox":{"minX":-180,"minY":0,"maxX":-135,"maxY":45}},{"x":1,"y":0,"level":2,"boundBox":{"minX":-135,"minY":45,"maxX":-90,"maxY":90}},{"x":0,"y":0,"level":2,"boundBox":{"minX":-180,"minY":45,"maxX":-135,"maxY":90}}]);
    */
		}
	}
};
</script>

<style lang="scss" scoped>
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;
.map {
	/*position: absolute;
  top: 93px;
  left: 0;
  right: 0;
  bottom: 0;*/
	width: 100vw;
	height: calc(100vh - 93px);
}

.deformationContainer {
	/*position: absolute;
  top: 93px;
  left: 0;
  right: 0;
  bottom: 0;*/
	width: 100vw;
	//height: calc((100vh - 93px)/4);
}

.deformation {
	height: calc((100vh - 93px) / 4);
}

.loading-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: rgba(255, 255, 255, 0.5);
}
</style>
