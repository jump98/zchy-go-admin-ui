<template>
  <LargeLineChart v-show="showChart" :image-data="imageData" :image-time="imageTime" @ImageIndexClick="onImageIndexClick" />
</template>

<script>
import moment from "moment";
import LargeLineChart from "./LargeLineChart.vue";
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
      imageData: [], // 你的2000条数据数组
      imageTime: "", //服务器时间
      showChart: false //显示报表
    };
  },
  watch: {
    radarid: {
      handler(newVal) {
        if (!newVal) return;
        this.showChart = !!newVal;
        console.log("监听radarid变化:", newVal);
        this.getImageData(newVal);
      }
    }
  },
  created() {
    // 生成示例数据（2000个随机数）
    this.imageData = Array.from({ length: 200 }, () => Math.floor(Math.random() * 1000));
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
    onImageIndexClick(data) {
      console.log("点击影像点：", data);
      this.$emit("addRadarPointEvent", data);
    },
    /** 查询参数列表 */
    async getImageData(radarid) {
      try {
        if (!radarid) return;
        console.log("请求获取影像信息：", radarid);
        let resp = await getSysRadarImage(radarid);
        let { Data, TimeStamp, RadarID } = resp.data;
        console.log("获取雷达影像结果:", Data, TimeStamp, RadarID);
        this.imageData = Data;
        this.imageTime = moment(TimeStamp * 1000).format("YYYY-MM-DD HH时mm分ss秒");
        this.showChart = true;
      } catch (error) {
        this.showChart = false;
      }
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
