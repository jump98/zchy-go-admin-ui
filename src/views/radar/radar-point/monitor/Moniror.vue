<template>
  <el-tabs v-model="actionName" tab-position="top" type="card" @tab-click="onHandleClick">
    <el-tab-pane label="形变曲线" name="1">
      <DeformDataChart v-if="actionName == 1" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
    </el-tab-pane>
    <el-tab-pane label="速度曲线" name="2">
      <DeformSleepChart v-if="actionName == 2" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
    </el-tab-pane>
    <el-tab-pane label="加速度曲线" name="3">
      <DeformAccelerationChat v-if="actionName == 3" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
    </el-tab-pane>
    <!-- <el-tab-pane label="形变距离曲线" name="4">
      <DeformDistanceChat v-if="actionName == 4" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
    </el-tab-pane> -->
  </el-tabs>
</template>
<script>
import DeformAccelerationChat from "./DeformAccelerationChat.vue";
import DeformDataChart from "./DeformDataChart.vue";
// import DeformDistanceChat from "./DeformDistanceChat.vue";
import DeformSleepChart from "./DeformVelocityChart.vue";

export default {
  name: "RadarPointMoniror",
  components: { DeformDataChart, DeformSleepChart, DeformAccelerationChat },
  props: {
    radarInfo: {
      type: Object,
      default: () => ({})
    },
    radarPointInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      closed: false, // 是否已关闭
      actionName: "1"
    };
  },
  created() {},
  mounted() {},

  activated() {
    // 页面再次激活时启动轮询
    this.getImageData();
  },

  deactivated() {
    // 隐藏时停止轮询
    this.closeTimeout();
  },

  beforeDestroy() {
    // 组件销毁前彻底停止轮询
  },
  destroyed() {},
  methods: {
    async onOpen() {
      // console.log("radarInfo onOpen", this.radarInfo);
      // let { radarName } = this.radarInfo;
      // let { pointName } = this.radarPointInfo;
      this.closed = false;
    },
    onClose() {
      this.close();
    },
    close() {
      console.log("关闭close");
      this.closed = true;
      this.$emit("update:visible", false);
    },
    onHandleClick() {}
  }
};
</script>
