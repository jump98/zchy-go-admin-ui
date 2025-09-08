<template>
  <el-tabs v-model="actionName" tab-position="top" type="card" @tab-click="onHandleClick">
    <el-tab-pane label="形变曲线" name="1">
      <DeformDataChart v-if="actionName == 1" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
    </el-tab-pane>
    <el-tab-pane label="形变速度曲线" name="2">
      <DeformSleepChart v-if="actionName == 2" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
    </el-tab-pane>
    <el-tab-pane label="形变加速度曲线" name="3">形变加速度监测</el-tab-pane>
  </el-tabs>
</template>
<script>
import DeformDataChart from "./DeformDataChart.vue";
import DeformSleepChart from "./DeformVelocityChart.vue";

export default {
  name: "RadarPointMoniror",
  components: { DeformDataChart, DeformSleepChart },
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
