<template>
  <div>
    <!-- 雷达列表和监测点列表 -->
    <div v-show="radarList.length > 0" style="position: absolute; top: 94px; right: 0px; z-index: 10; background: rgba(0, 0, 0, 0.5); padding: 10px; border-radius: 5px; max-height: 80vh; overflow-y: auto; color: white">
      <!-- 雷达列表 -->
      <div>
        <h3>雷达列表</h3>
        <ul style="list-style: none; padding: 0; margin: 0">
          <li v-for="radar in radarList" :key="radar.radarId" :style="getRadarItemStyle(radar)" @click="selectRadar(radar)">
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
            :style="{
              cursor: 'pointer',
              padding: '5px',
              backgroundColor: selectedPoint && selectedPoint.id === point.id ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
              color: 'white'
            }"
            @click="selectPoint(point)"
          >
            {{ point.pointName }}
          </li>
        </ul>
        <div v-else style="padding: 5px; color: white">该雷达没有监测点信息</div>
      </div>
    </div>

    <div class="deformationContainer" style="position: absolute; bottom: 0; right: 0; width: 100%; z-index: 8">
      <DeformationLineChart v-show="timerIdForDeformationData != null" class="deformation" :image-data="chartData" :point-index="currentPointIndex" :radar-name="currentRadarName" />
      <div v-show="timerIdForDeformationData != null" style="display: flex; align-items: center; margin-bottom: 10px">
        <label style="color: #fff">开始时间:</label>
        <input v-model="startTime" type="datetime-local" style="margin-right: 20px" />
        <label style="color: #fff">结束时间:</label>
        <input v-model="endTime" type="datetime-local" style="margin-right: 20px" />
        <!--button @click="updateChartData" style="padding: 5px 10px;">更新图表</button-->
      </div>
    </div>
    <div id="map-container" ref="cesiumContainer" class="map" style="width: 100%">
      <div v-if="loading" class="loading-overlay">正在加载中，请稍候...</div>
      <!-- 鼠标位置显示 -->
      <div v-show="timerIdForDeformationData == null" class="mouse-position" style="position: absolute; bottom: 10px; left: 10px; background: rgba(0, 0, 0, 0.5); color: white; padding: 5px 10px; border-radius: 3px; font-size: 12px; z-index: 100">
        经度: {{ mousePosition.longitude.toFixed(6) }} 纬度:
        {{ mousePosition.latitude.toFixed(6) }}
      </div>
    </div>
    <!-- 雷达告警对话框 -->
    <RadarAlarmDialog :visible.sync="showAlarmDialog" :radar-info="selectedRadarForAlarm" />
  </div>
</template>

<script>
import { TCesiem } from "@/utils/js/tcesium/tcesium";
import { getRadarPointDeformData, listDeptRadarPoint } from "@/api/admin/radar-point";
import { getRadarsAlarms, listSysRadar } from "@/api/admin/sys-radar";
import DeformationLineChart from "./radar/DeformationLineChart.vue";
import RadarAlarmDialog from "./radar/RadarAlarmDialog.vue";

const radarPrefix = "radar_";
const radarPointPrefix = "radarpt_";
const pointPrefix = "point_";
const indexPrefix = "index_";

// 引用public下面的Cesium.js
const Cesium = window["Cesium"];

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
        longitude: 0, // 经度
        latitude: 0 // 纬度
      }
    };
  },
  computed: {
    // 计算属性：过滤当前雷达的监测点
    filteredPoints() {
      console.log("computed.filteredPoints.会掉用吗？");
      if (!this.selectedRadar) {
        return [];
      }
      return this.pointList.filter(point => point.radarId === this.selectedRadar.radarId);
    }
  },
  created() {
    console.log("Dashboard 页面创建时触发");
  },
  // 页面被隐藏时触发
  deactivated() {
    console.error("Dashboard 页面被隐藏时触发");
  },
  // 离开页面时触发
  destroyed() {
    console.error("Dashboard 离开页面时触发");
    // 停止告警雷达闪烁定时器
    this.stopBlinkingTimer();
  },
  // 每次切回这个页面时触发
  activated() {
    console.error("Dashboard 每次切回这个页面时触发");
    this.$nextTick(() => {
      if (this.viewer) {
        console.log("this.viewer.canvas=", this.viewer.canvas);
        this.resizeCanvas();
      }
    });
  },
  // 页面加载完成时触发
  mounted() {
    console.log("Dashboard 页面加载完成时触发:", process.env.BASE_URL);
    this.init();
  },

  methods: {
    // 监听鼠标事件
    onCesiumEventHandler() {
      // 创建事件处理器

      TCesiem.OnMouseMoveEvent(this.viewer, position => {
        // const lon = Cesium.Math.toDegrees(position.longitude); // 经度
        // const lat = Cesium.Math.toDegrees(position.latitude); // 纬度
        this.mousePosition.longitude = position.longitude; // 经度
        this.mousePosition.latitude = position.latitude; // 纬度

        console.log(`经度: ${position.longitude}, 纬度: ${position.latitude}`);
      });

      // const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

      // // 监听鼠标移动
      // handler.setInputAction(movement => {
      //   console.log("鼠标移动", movement);
      //   const cartesian = this.viewer.scene.pickPosition(movement.endPosition);
      //   console.log("cartesian:", cartesian);
      //   if (cartesian) {
      //     const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      //     const lon = Cesium.Math.toDegrees(cartographic.longitude); // 经度
      //     const lat = Cesium.Math.toDegrees(cartographic.latitude); // 纬度
      //     const height = cartographic.height; // 高度
      //     this.mousePosition.longitude = lon;
      //     this.mousePosition.latitude = lat;
      //     console.log(`经度: ${lon}, 纬度: ${lat}, 高度: ${height}`);
      //   }
      // }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },

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

    // TODO:测试：获取变形点数据
    async testGetRadarPointDeformData() {
      const resp = await getRadarPointDeformData({
        devid: 20,
        index: 3,
        startTime: this.formatDateTime(this.startTime),
        endTime: this.formatDateTime(this.endTime)
      });
      console.log("测试：获取变形点数据:", resp);
    },

    // 启动定时器获取雷达信息
    startRadarTimer() {
      const that = this;
      this.timerIdForRadar = setTimeout(() => {
        // console.log("Timer executed");
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

            // 成功获取雷达信息后再获取监测点
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
      const that = this;
      this.timerIdForPoint = setTimeout(() => {
        // console.log("Timer executed");
        const radarids = this.radarList.map(item => item.radarId);
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
      // TODO:关闭定时查询
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
      const that = this;
      this.timerIdForDeformation = setTimeout(() => {
        // console.log("Timer executed");
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
      const that = this;
      // 启动新的定时器，每秒调用一次
      this.timerIdForDeformationData = setInterval(() => {
        that.updateChartData();
      }, 1000);
    },

    // 更新图表数据的方法
    updateChartData() {
      const that = this;
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
              const chartData = res.data.map(item => ({
                SvrTime: new Date(item.SvrTime).getTime(),
                Deformation: item.Deformation
              }));
              // console.log('chartData=', chartData);
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
      const entid = this.getRadarEntityID(radarId);
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
        const entid = this.getRadarPointEntityID(p.radarId, p.id, p.pointIndex);
        const rEntity = this.getEntityById(entid);
        if (!rEntity) {
          // 添加带 ID 和名称的圆点
          const entity = this.viewer.entities.add({
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
          const that = this;
          // 为实体添加点击事件监听器
          // 使用立即执行函数来保存ptEnt的值
          this.viewer.screenSpaceEventHandler.setInputAction(function (click) {
            const pickedObject = that.viewer.scene.pick(click.position);
            console.log("点击了:pickedObject=", pickedObject);
            if (!pickedObject || !pickedObject.id || !pickedObject.id._id) {
              that.stopUpdateChartData();
              that.chartData = [];
              that.selectedRadarPoint = null;
              return;
            }
            console.log("点击了:", pickedObject, pickedObject.id._id);
            const entIds = that.getRadarIDFromPointEntityID(pickedObject.id._id);
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

          const rEntity = this.getRadarEntity(p.radarId);
          if (rEntity) {
            // 在雷达和监测点之间画一条线
            var line = this.viewer.entities.add({
              polyline: {
                positions: [rEntity.position.getValue(), entity.position.getValue()], // 起点和终点坐标
                width: 1, // 线宽（像素）
                // material: Cesium.Color.YELLOW, // 线颜色
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
    async init() {
      this.loading = false;
      console.log("init.执行init:", process.env.BASE_URL);
      // console.log("Cesium:", Cesium);

      this.viewer = await TCesiem.NewTCesium(this.$refs.cesiumContainer);
      if (this.viewer) {
        console.log("Cesium 初始化完成", this.viewer);
      }
      console.log("this.viewer=", this.viewer);

      // 添加窗口大小变化事件监听器
      window.addEventListener("resize", () => {
        this.viewer.resize();
      });
      this.viewer.resize();
      // 监听鼠标事件
      this.onCesiumEventHandler();
      //
      this.testGetRadarPointDeformData();

      // cesium 初始化
      // this.viewer = new Cesium.Viewer(this.$refs.cesiumContainer, {
      //   sceneMode: Cesium.SceneMode.SCENE2D, // 关键参数：强制使用二维模式
      //   animation: false,
      //   shouldAnimate: false, //是否允许动画
      //   selectionIndicator: false,
      //   baseLayerPicker: false,
      //   fullscreenButton: false,
      //   geocoder: false,
      //   homeButton: false,
      //   infoBox: false,
      //   sceneModePicker: false,
      //   timeline: false,
      //   navigationHelpButton: false,
      //   navigationInstructionsInitiallyVisible: false,
      //   showRenderLoopErrors: false,
      //   shadows: false
      // });
      // this.viewer._cesiumWidget._creditContainer.style.display = "none";
      // this.viewer.cesiumWidget.creditContainer.style.display = "none";
      // // 获取所有的图层
      // let imageryLayers = this.viewer.imageryLayers;
      // // 假设你知道你想要删除的图层的索引或者图层的名称
      // console.log("imageLayere:", imageryLayers?.length);
      // let layers = imageryLayers._layers;
      // // 例如，通过名称删除图层
      // for (var i = layers.length - 1; i >= 0; i--) {
      //   imageryLayers.remove(layers[i]);
      // }

      // // 抗锯齿
      // this.viewer.scene.fxaa = true;
      // this.viewer.scene.postProcessStages.fxaa.enabled = false;
      // // 水雾特效
      // //this.viewer.scene.globe.showGroundAtmosphere = true;
      // // 设置最大俯仰角，[-90,0]区间内，默认为-30，单位弧度
      // this.viewer.scene.screenSpaceCameraController.constrainedPitch = Cesium.Math.toRadians(-20);
      // this.viewer.scene.screenSpaceCameraController.autoResetHeadingPitch = false;
      // this.viewer.scene.screenSpaceCameraController.inertiaZoom = 0.5;
      // this.viewer.scene.screenSpaceCameraController.minimumZoomDistance = 50;
      // this.viewer.scene.screenSpaceCameraController.maximumZoomDistance = 20000000;
      // this.viewer.scene.screenSpaceCameraController.zoomEventTypes = [Cesium.CameraEventType.RIGHT_DRAG, Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH];
      // this.viewer.scene.screenSpaceCameraController.tiltEventTypes = [
      //   Cesium.CameraEventType.MIDDLE_DRAG,
      //   Cesium.CameraEventType.PINCH,
      //   {
      //     eventType: Cesium.CameraEventType.LEFT_DRAG,
      //     modifier: Cesium.KeyboardEventModifier.CTRL
      //   },
      //   {
      //     eventType: Cesium.CameraEventType.RIGHT_DRAG,
      //     modifier: Cesium.KeyboardEventModifier.CTRL
      //   }
      // ];
      // 取消默认的双击事件
      // this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

      // // 叠加影像服务
      // var imgMap = new Cesium.UrlTemplateImageryProvider({
      // 	url: tdtUrl + "DataServer?T=img_w&x={x}&y={y}&l={z}&tk=" + token,
      // 	subdomains: subdomains,
      // 	tilingScheme: new Cesium.WebMercatorTilingScheme(),
      // 	maximumLevel: 18
      // });
      // this.viewer.imageryLayers.addImageryProvider(imgMap);

      // 叠加国界服务
      // var iboMap = new Cesium.UrlTemplateImageryProvider({
      //   url: tdtUrl + "DataServer?T=ibo_w&x={x}&y={y}&l={z}&tk=" + token,
      //   subdomains: subdomains,
      //   tilingScheme: new Cesium.WebMercatorTilingScheme(),
      //   maximumLevel: 10
      // });
      // this.viewer.imageryLayers.addImageryProvider(iboMap);

      // let self = this;
      // // 将三维球定位到中国
      // this.viewer.camera.flyTo({
      //   destination: Cesium.Cartesian3.fromDegrees(103.84, 31.15, 17850000),
      //   orientation: {
      //     heading: Cesium.Math.toRadians(0),
      //     pitch: Cesium.Math.toRadians(-90),
      //     roll: Cesium.Math.toRadians(0)
      //   },

      //   complete: function callback() {
      //     // 定位完成之后的回调函数
      //   }
      // });

      // 设置定时器
      // setTimeout(e => {
      // 	self.startRadarTimer();
      // 	self.resizeCanvas();
      // }, 100);
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
