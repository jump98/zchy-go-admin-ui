<template>
  <el-dialog v-bind="$attrs" title="详情" width="92%" :close-on-click-modal="false" @opened="onOpen" @close="onClose">
    <el-tabs v-model="actionName" tab-position="left" @tab-click="onHandleClick">
      <el-tab-pane label="监测数据" name="1">
        <RadarPointMoniror v-if="actionName == 1" :radar-info="radarInfo" :radar-point-info="radarPointInfo" />
      </el-tab-pane>
      <el-tab-pane label="预警信息" name="2">预警信息</el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>
<script>
import RadarPointMoniror from "./monitor/Moniror.vue";

export default {
  name: "RadarPointDetailDialog",
  components: { RadarPointMoniror },
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
    // console.log("RadarPointDetailDialog");
  },
  destroyed() {},
  methods: {
    async onOpen() {
      console.log("radarInfo onOpen", this.radarInfo);
      let { radarName } = this.radarInfo;
      let { pointName } = this.radarPointInfo;
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
