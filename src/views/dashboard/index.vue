<template>
  <div>
    <div id="map-container" ref="cesiumContainer" class="map" style="width: 100%">
      <!-- 加载提示 -->
      <div v-if="loading" class="loading-overlay">正在加载中，请稍候...</div>

      <!-- 鼠标位置（固定左下角） -->
      <div class="mouse-position">位置： {{ mousePos.x.toFixed(6) }} , {{ mousePos.y.toFixed(6) }}</div>
      <!-- <div class="mouse-position">位置： {{ mousePos.x.toFixed(6) }} , {{ mousePos.y.toFixed(6) }}</div> -->

      <!-- 左上角按钮工具栏 -->
      <div class="toolbar">
        <el-button type="primary" size="small" @click="onClickRefreshBtn">刷新</el-button>
        <!-- <el-button type="success" size="small" @click="addPoint">添加点</el-button> -->

        <el-select v-model="inputRadarName" placeholder="查询" @change="onChangeEvent">
          <el-option v-for="item in radarNames" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <!-- 雷达信息弹窗-->
      <RadarItemDialog :visible.sync="openRadarItemDialog" :radar-info="clickRadarRow" />
      <!-- 监控点信息弹窗-->
      <DeformDataChart :visible.sync="showDeformDataChart" :radar-info="radarRow" :radar-point-info="clickRadarPointRow" />
    </div>
  </div>
</template>

<script>
import { RadarPointTag, RadarTag, TCesiem } from "@/utils/tcesium/tcesium";
import { getRadarPointList } from "@/api/admin/radar-point";
import { getRadarList } from "@/api/admin/sys-radar";
import DeformDataChart from "../radar/radar-point-deform/DeformDataChart.vue";
import RadarItemDialog from "../radar/sys-radar/RadarItemDialog.vue";

// 引用public下面的Cesium.js
const Cesium = window["Cesium"];

export default {
  name: "Dashboard",
  components: {
    DeformDataChart,
    RadarItemDialog
  },
  data() {
    return {
      // 事件
      handler: null,
      loading: true,
      // 雷达列表
      radarList: [],
      // 选中的雷达
      radarRow: null,
      // 点击的雷达
      clickRadarRow: null,
      // 点击的雷达点位
      clickRadarPointRow: null,
      radarNames: [],
      inputRadarName: "",
      viewer: null,
      // 雷达和监测点列表相关数据
      pointList: [],
      // 鼠标位置
      mousePos: {
        x: 0, // 经度
        y: 0 // 纬度
      },
      openRadarItemDialog: false, // 控制雷达信息弹出框显示
      showRadarAlarmDialog: false, // 控制雷达报警信息弹窗
      showDeformDataChart: false // 控制雷达点位弹出框显示
    };
  },
  computed: {},

  // 页面创建时触发
  created() {
    console.log("Dashboard页面创建时触发");
    this.init();
  },
  // 页面加载完成时触发
  mounted() {
    console.log("Dashboard页面加载完成时触发");
  },
  // 页面再次激活时
  activated() {
    console.error("Dashboard 页面再次激活时");
    // this.init();
  },
  // 页面隐藏时
  deactivated() {},

  beforeDestroy() {
    // 组件销毁前彻底停止轮询
    console.log("RadarStateInfo beforeDestroy");
    this.viewDestroy();
  },
  // 离开页面时触发
  destroyed() {
    console.log("RadarStateInfo destroyed");
    this.viewDestroy();
  },

  methods: {
    // 初始化地图信息
    async init() {
      this.loading = true;
      console.log("初始化地图信息");
      // 获取雷达列表
      let resp = await getRadarList();
      let { list } = resp.data;
      console.log("雷达列表：", list);
      this.radarList = list;
      if (!list || list.length === 0) {
        this.loading = false;
        console.error("没有雷达，暂时不显示地图信息！！！");
        return;
      }

      let { lng, lat, radarId } = list[0];
      let pos = { x: lng, y: lat };

      try {
        // 创建 Cesium viewer
        this.viewer = await TCesiem.NewTCesium(this.$refs.cesiumContainer, pos);
        this.loading = false;

        // 绑定鼠标事件，保证在 viewer 初始化后执行
        this.onCesiumEventHandler();

        // 初始化下拉框
        this.initRadarNames(list);

        // 显示雷达点位
        await this.showRadarEntities(radarId);

        // 添加窗口大小变化事件监听器
        window.addEventListener("resize", this.handleResize);
      } catch (err) {
        console.error("初始化Cesium失败:", err);
      }
    },
    // 销毁 viewer 和事件监听器
    viewDestroy() {
      console.log("销毁 Cesium 实例及事件监听器");
      if (this.handler && !this.handler.isDestroyed()) {
        this.handler.destroy();
        this.handler = null;
      }
      if (this.viewer && !this.viewer.isDestroyed()) {
        this.viewer.entities.removeAll();
        this.viewer.destroy();
        this.viewer = null;
      }

      // 移除窗口大小监听
      window.removeEventListener("resize", this.handleResize);
    },

    // 窗口大小变化回调
    handleResize() {
      if (this.viewer) {
        this.viewer.resize();
      }
    },

    // 监听鼠标事件
    onCesiumEventHandler() {
      if (!this.viewer) return;

      try {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);

        // 鼠标移动事件
        TCesiem.OnMouseMoveEvent(this.viewer, this.handler, position => {
          this.mousePos = position;
        });

        // 鼠标左键点击事件
        TCesiem.OnMouseLifeClickEvent(this.viewer, this.handler, callback => {
          console.log("点击实物:", callback);
          let { id, tag, pos } = callback;

          TCesiem.FlyToPos(this.viewer, 0.5, pos, () => {
            if (tag === RadarTag) {
              this.clickRadarRow = this.radarList.find(item => item.radarKey === id);
              this.openRadarItemDialog = true;
            }
            if (tag === RadarPointTag) {
              this.clickRadarPointRow = this.radarPointList.find(item => item.pointKey === id);
              this.showDeformDataChart = true;
            }
          });
        });
      } catch (error) {
        console.error("绑定鼠标事件失败:", error);
      }
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
      let radarPointList = resp.data.list;
      this.radarPointList = radarPointList;
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
      this.inputRadarName = this.radarNames[0].value;
    },

    // 点击刷新按钮
    async onClickRefreshBtn() {
      console.log("点击刷新按钮");
      this.viewDestroy();
      await this.init();
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
