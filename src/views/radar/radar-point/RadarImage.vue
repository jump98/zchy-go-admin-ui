<template>
  <LargeLineChart :image-data="chartData" :image-time="svrTime" @ImageIndexClick="onImageIndexClick" />
</template>

<script>
import LargeLineChart from "./LargeLineChart2";
import { getSysRadarImage } from "@/api/admin/sys-radar";

export default {
  name: "RadarImage",
  components: {
    LargeLineChart
  },
  props: {
    radarid: {
      type: Number,
      required: true,
      default: 0
    }
  },
  data() {
    return {
      timerId: null,
      chartData: [], // 你的2000条数据数组
      svrTime: ""
    };
  },
  watch: {
    radarid: {
      handler(newVal) {
        console.log("RadarImage.vue.radarid=", newVal);
        this.getImageData(newVal);
      },
      deep: true
    }
  },
  created() {
    // 生成示例数据（2000个随机数）
    this.chartData = Array.from({ length: 200 }, () => Math.floor(Math.random() * 1000));
  },
  mounted() {
    console.log("RadarImage.mounted");
    this.startTimer();
  },
  beforeDestroy() {
    if (this.timerId) {
      clearTimeout(this.timerId); // 清除定时器
    }
  },
  methods: {
    emitAddRadarPoint(index) {
      this.$emit("sigAddRadarPoint", index);
    },
    onImageIndexClick(data) {
      console.log("onImageIndexClick", data);
      this.emitAddRadarPoint(data);
    },
    /** 查询参数列表 */
    async getImageData(radarid) {
      //console.log('getImageData radarid=',radarid)
      if (!radarid) return;
      let resp = await getSysRadarImage(radarid);
      console.log("获取雷达影像结果:", resp);
      this.chartData = resp.data.Data;
      this.svrTime = resp.data.SvrTime;
    },
    startTimer() {
      let self = this;
      console.log("that.radarid:", self.radarid);
      if (!self.radarid) return;
      // this.timerId = setTimeout(() => {
      //console.log("Timer executed");
      self.getImageData(self.radarid);
      self.startTimer();
      // }, 1000);
    }
  }
};
</script>
