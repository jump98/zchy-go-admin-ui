<template>
  <RadarImageChart v-show="showChart" :radar-point-list="radarPointList" :image-data="imageData" :image-time="imageTime" @ImageIndexClick="onImageIndexClick" />
</template>

<script>
import moment from "moment";
import RadarImageChart from "./RadarImageChart.vue";
import { getSysRadarImage } from "@/api/admin/sys-radar";

export default {
  name: "RadarImage",
  components: {
    RadarImageChart
  },
  props: {
    radarId: {
      type: Number,
      required: true,
      default: 0
    },
    radarPointList: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      timerId: null,
      imageData: [], // 你的2000条数据数组
      imageTime: "", // 服务器时间
      showChart: false // 显示报表
    };
  },
  watch: {
    radarId: {
      handler(newVal) {
        if (!newVal) return;
        this.showChart = !!newVal;
        console.log("监听radarid变化:", newVal);
        // 清除之前的定时器
        this.closeTimeout();
        this.getImageData(newVal);
      }
    }
  },
  created() {},
  mounted() {},

  activated() {
    // 页面再次激活时启动轮询
    this.getImageData();
  },

  deactivated() {
    // keep-alive 页面隐藏时停止轮询
    this.closeTimeout();
  },

  beforeDestroy() {
    // 组件销毁前彻底停止轮询
    console.log("RadarStateInfo beforeDestroy");
    this.closeTimeout();
  },
  destroyed() {
    console.log("RadarStateInfo destroyed");
  },
  methods: {
    onImageIndexClick(data) {
      console.log("点击影像点：", data);
      this.$emit("addRadarPointEvent", data);
    },
    /** 查询参数列表 */
    async getImageData(radarId) {
      try {
        if (!radarId) return;
        console.log("请求获取影像信息：", radarId);
        let resp = await getSysRadarImage(radarId);
        let { Data, TimeStamp } = resp.data;
        console.log("获取雷达影像结果:", TimeStamp);
        this.imageData = Data;
        this.imageTime = moment(TimeStamp * 1000).format("YYYY-MM-DD HH时mm分ss秒");
        this.showChart = true;
        // this.timerId = setTimeout(() => this.getImageData(radarId), 1000); // 30秒轮询
      } catch (error) {
        this.showChart = false;
        // 后续可以根据失败的次数，来设置timeout的时间间隔
        this.closeTimeout();
      }
    },
    // 关闭定时器
    closeTimeout() {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
        console.log("RadarImage.轮询已停止");
      }
    }
  }
};
</script>
