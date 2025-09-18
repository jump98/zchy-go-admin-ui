<template>
  <RadarImageChart v-if="showChart" :radar-point-list="radarPointList" :image-data="imageData" :image-time="imageTime" @ImageIndexClick="onImageIndexClick" />
</template>

<script>
import { getSysRadarImage } from "@/api/radar/sys-radar";
import moment from "moment";
import RadarImageChart from "./RadarImageChart.vue";

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
      timers: [], // 统一管理定时器
      imageData: [], // 数据数组
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
        this.clearAllTimers();
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
    this.clearAllTimers();
  },

  beforeDestroy() {
    // 组件销毁前彻底停止轮询
    console.log("RadarStateInfo beforeDestroy");
    this.clearAllTimers();
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
        this.addTimeout(() => this.getImageData(radarId), 1000);
      } catch (error) {
        this.showChart = false;
        // 后续可以根据失败的次数，来设置timeout的时间间隔
        this.clearAllTimers();
      }
    },
    // 添加定时器并保存到数组
    addTimeout(fn, delay) {
      if (this.timers.length > 0) return;
      // if (this.closed) return;
      const id = setTimeout(() => {
        fn();
        // 一次性定时器执行后可移除
        this.timers = this.timers.filter(t => t !== id);
      }, delay);
      this.timers.push(id);
      return id;
    },

    // 清理所有定时器
    clearAllTimers() {
      this.timers.forEach(id => clearTimeout(id));
      this.timers = [];
      console.log("RadarImage.所有轮询已停止");
    }
  }
};
</script>
