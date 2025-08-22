<template>
  <div>
    <div id="map-container" ref="cesiumContainer" class="map" style="width: 100%">
      <!-- 加载提示 -->
      <div v-if="loading" class="loading-overlay">正在加载中，请稍候...</div>

      <!-- 鼠标位置（固定左下角） -->
      <div v-show="timerIdForDeformationData == null" class="mouse-position">位置： {{ mousePos.x.toFixed(6) }} , {{ mousePos.y.toFixed(6) }}</div>
      <!-- <div class="mouse-position">位置： {{ mousePos.x.toFixed(6) }} , {{ mousePos.y.toFixed(6) }}</div> -->

      <!-- 左上角按钮工具栏 -->
      <div class="toolbar">
        <el-button type="primary" size="small" @click="onClickRefreshBtn">刷新</el-button>
        <!-- <el-button type="success" size="small" @click="addPoint">添加点</el-button> -->

        <el-select v-model="inputRadarName" placeholder="查询" @change="onChangeEvent">
          <el-option v-for="item in radarNames" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <RadarItemDialog :visible.sync="showRadarItemDialog" :radar-info="clickRadarRow" />
    </div>
  </div>
</template>

<script>
import { RadarTag, TCesiem } from "@/utils/tcesium/tcesium";
import { getRadarPointDeformData, listDeptRadarPoint, getRadarPointList } from "@/api/admin/radar-point";
import { getRadarList } from "@/api/admin/sys-radar";
import DeformationLineChart from "./radar/DeformationLineChart.vue";
import RadarAlarmDialog from "./radar/RadarAlarmDialog.vue";
import RadarItemDialog from "./radar/RadarItemDialog.vue";

// 引用public下面的Cesium.js
// const Cesium = window["Cesium"];

export default {
  name: "Dashboard",
  components: {
    DeformationLineChart,
    RadarAlarmDialog,
    RadarItemDialog
  },
  data() {
    return {
      loading: true,
      // 雷达列表
      radarList: [],
      // 选中的雷达
      radarRow: null,
      // 点击的雷达
      clickRadarRow: null,
      radarNames: [],
      inputRadarName: "",

      //
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
      mousePos: {
        x: 0, // 经度
        y: 0 // 纬度
      },
      showRadarItemDialog: false // 控制雷达信息弹出框显示
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

  // 页面创建时触发
  created() {
    this.init();
  },
  // 页面加载完成时触发
  mounted() {},
  // 页面再次激活时
  activated() {
    console.error("Dashboard 页面再次激活时");
  },
  // 页面隐藏时
  deactivated() {
    //  this.closeTimeout();
  },

  beforeDestroy() {
    // 组件销毁前彻底停止轮询
    console.log("RadarStateInfo beforeDestroy");
    // this.closeTimeout();
  },
  // 离开页面时触发
  destroyed() {
    console.log("RadarStateInfo destroyed");
  },

  methods: {
    // 初始化地图信息
    async init() {
      let resp = await getRadarList();
      let { list } = resp.data;
      console.log("雷达列表：", list);
      this.radarList = list;
      if (!list || list.length == 0) return;
      let { lng, lat, radarId } = list[0]; // 或者是最后一次选择雷达的位置
      let pos = { x: lng, y: lat };
      try {
        this.viewer = await TCesiem.NewTCesium(this.$refs.cesiumContainer, pos);
        this.loading = false;
      } catch (err) {
        console.error("初始化Cesium失败:", err);
        return;
      }

      // 初始化下拉框
      this.initRadarNames(list);
      // 显示雷达点位信息
      this.showRadarEntities(radarId);

      // 添加窗口大小变化事件监听器
      // window.addEventListener("resize", () => {
      //   this.viewer.resize();
      // });
      // this.viewer.resize();
      // 监听鼠标事件
      this.onCesiumEventHandler();
    },

    // 添加雷达点位
    async addRadarPointList() {
      let { radarId } = this.radarRow;
      let resp = await getRadarPointList({ radarId });
      let { list: radarPointList } = resp.data;
      console.log("点位列表：", radarPointList);
      if (!this.viewer) return;
      for (const item of radarPointList) {
        let { lng, lat, pointKey, pointName } = item;
        let pos = { x: lng, y: lat };
        TCesiem.AddRadarPointEntities(this.viewer, pos, pointKey, pointName);
      }
      // 获取监控点数据
    },

    // 监听鼠标事件
    onCesiumEventHandler() {
      // 处理鼠标移动事件
      TCesiem.OnMouseMoveEvent(this.viewer, position => {
        this.mousePos = position;
      });

      // 处理鼠标左键点击事件
      TCesiem.OnMouseLifeClickEvent(this.viewer, callback => {
        console.log("鼠标点击了:", callback);
        let { id, tag, pos } = callback;
        console.log("id:", id);
        // 飞到指定位置
        TCesiem.FlyToPos(this.viewer, 0.5, pos, () => {
          // console.log("飞完回调");
          // 雷达设备
          if (tag === RadarTag) {
            this.clickRadarRow = this.radarList.find(item => item.radarKey === id);
            console.log("this.clickRadarRow:", this.clickRadarRow);
            this.showRadarItemDialog = true;
          }
        });
      });
    },

    // 显示雷达点位
    async showRadarEntities(radarId) {
      // 先清空所有实体
      this.viewer.entities.removeAll();

      let radarItem = this.radarList.find(item => item.radarId === radarId);
      this.radarRow = radarItem;
      let { lng, lat, radarKey, radarName } = radarItem;
      let pos = { x: lng, y: lat };
      // 添加雷达
      TCesiem.AddRadarEntities(this.viewer, pos, radarKey, radarName);
      // 飞到指定位置
      TCesiem.FlyToPos(this.viewer, 2, pos, () => {});

      // 添加雷达点位
      let resp = await getRadarPointList({ radarId });
      let { list: radarPointList } = resp.data;
      console.log("点位列表：", radarPointList);
      if (!this.viewer || radarPointList.length == 0 || radarPointList[0].radarId != radarId) return;
      for (const item of radarPointList) {
        let { lng, lat, pointKey, pointName } = item;
        let pos = { x: lng, y: lat };
        TCesiem.AddRadarPointEntities(this.viewer, pos, pointKey, pointName);
      }
    },

    // resizeCanvas() {
    //   this.viewer.canvas.style.width = "100%";
    //   this.viewer.canvas.style.height = "100vh";
    //   this.viewer.resize(); // 确保调用 resize 方法来更新视图大小
    // },

    // 初始化雷达下拉框
    initRadarNames(radarList) {
      this.radarNames = [];
      for (const item of radarList) {
        let { radarKey, radarId } = item;
        this.radarNames.push({ value: radarId, label: radarKey });
      }
      console.log("radarNames:", this.radarNames);
      this.inputRadarName = this.radarNames[0].value;
    },

    // 点击刷新按钮
    onClickRefreshBtn() {
      console.log("点击刷新按钮");
    },
    // 下拉框change
    onChangeEvent(value) {
      this.showRadarEntities(value);
    }
  }
};
</script>

<style lang="scss" scoped>
.map {
  position: relative; /* 父容器要相对定位，子元素才能绝对定位 */
  width: 100%;
  // height: 100vh;
  height: calc(100vh - 93px);
}

/* 左上角工具栏 */
.toolbar {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 999;
  display: flex;
  gap: 6px;
}

/* 左下角鼠标位置 */
.mouse-position {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 999;
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
