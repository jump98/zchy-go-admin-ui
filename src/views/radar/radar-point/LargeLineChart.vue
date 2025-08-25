<template>
  <div class="myChart-container">
    <!-- 折线图容器 -->
    <div ref="lineChart" style="width: 100%; height: 400px" />
  </div>
</template>

<script>
// 按需引入（推荐，体积更小）
// 按需引入 ECharts 5
import * as echarts from "echarts/core";
import { TooltipComponent, GridComponent, LegendComponent, TitleComponent, DataZoomComponent } from "echarts/components";
import { LineChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([TooltipComponent, GridComponent, TitleComponent, LegendComponent, DataZoomComponent, LineChart, CanvasRenderer, UniversalTransition]);

export default {
  name: "LargeLineChart",

  props: {
    imageData: {
      type: Array,
      required: true,
      default: () => []
    },
    imageTime: {
      type: String,
      default: ""
    }
  },

  data() {
    return {
      myChart: null,
      xAxisData: [],
      // seriesData: [{ name: "距离值", data: [] }],
      currentIndex: null // 当前标记区域缓存
    };
  },

  watch: {
    imageTime(newVal) {
      console.log("服务器时间：", newVal);
      this.refreshData();
    }
  },

  mounted() {
    console.log("myChart.mounted:", this.imageData);
    this.initChart();
    window.addEventListener("resize", this.handleResize);
  },

  beforeDestroy() {
    console.log("LargeLineChart.beforeDestroy");
    this.removeChart();
  },

  methods: {
    /** 刷新图表数据 */
    refreshData() {
      if (this.myChart) {
        this.updateData();
      }
    },

    /** 销毁图表 */
    removeChart() {
      window.removeEventListener("resize", this.handleResize);
      if (this.myChart) {
        this.myChart.off("updateAxisPointer", this.handleUpdatePointer);
        this.myChart.getZr().off("click", this.handleZrClick);
        this.myChart.dispose();
        this.myChart = null;
      }
    },

    /** 初始化图表 */
    initChart() {
      // 文档： https://echarts.apache.org/zh/option.html#series-line
      let option = {
        animation: false,
        title: {
          text: "当前雷达最新影像数据",
          left: "center"
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" }
        },
        legend: {},
        xAxis: [
          {
            type: "category",
            data: [],
            axisLabel: { rotate: 45 },
            name: "监测点"
          }
        ],
        yAxis: [
          {
            type: "value",
            name: "信号",
            position: "left",
            axisLabel: {
              formatter: "{value}"
            }
          }
        ],
        series: [
          {
            name: "雷达距离像数据", // 系列名称，用于tooltip的显示
            type: "line", // 折线图
            // smooth: true, // 是否平滑线显示
            yAxisIndex: 0,
            sampling: "lttb", // 降采样
            data: []
          }
        ],
        // 缩放
        dataZoom: [
          {
            type: "inside", // 内置型，支持鼠标滚轮缩放
            xAxisIndex: 0, // 作用在第一个x轴
            start: 0, // 初始显示范围起始百分比
            end: 100 // 初始显示范围结束百分比
          },
          {
            type: "slider", // 外部滑动条，也可选择显示
            xAxisIndex: 0,
            start: 0,
            end: 100
          }
        ]
      };

      this.myChart = echarts.init(this.$refs.lineChart);
      this.myChart.setOption(option);
      this.bindClickEvent();
    },

    bindClickEvent() {
      this.myChart.on("updateAxisPointer", this.handleUpdatePointer);
      this.myChart.getZr().on("click", this.handleZrClick);
    },
    handleUpdatePointer(event) {
      if (event.axesInfo && event.axesInfo.length > 0) {
        const axisInfo = event.axesInfo[0];
        const xData = this.myChart.getOption().xAxis[0].data;
        this.currentIndex = xData.indexOf(axisInfo.value);
      }
    },
    handleZrClick() {
      if (this.currentIndex != null) {
        console.log("点击点位:", this.currentIndex);
        this.$emit("ImageIndexClick", { index: this.currentIndex });
      }
    },

    /** 更新标记区域 */
    updateMarkArea() {
      this.myChart.setOption({
        series: [
          {
            markArea: {
              data: [this.currentMark],
              animation: false
            }
          }
        ]
      });
    },

    /** 窗口大小变化 */
    handleResize() {
      this.myChart?.resize();
    },

    /** 更新数据 */
    updateData() {
      this.handleResize();
      // const MAX_POINTS = 12000; // 限制最大点数
      // const latestData = this.imageData.slice(-MAX_POINTS);

      // 距离像信号强度数据
      let data = this.imageData;
      // let data = Array.from({ length: 10000 }, () => Math.floor(Math.random() * 10000) + 1);
      // 下标点位
      let xAxisData = data.map((_, i) => i);
      // console.log("xAxisData:", xAxisData);

      // let series = [50, 100, 200, 400];
      // console.log("距离像信号强度数据:", data);
      this.myChart.setOption(
        {
          xAxis: { data: xAxisData },
          series: [{ data: data }],
          title: { text: "当前雷达最新影像数据 " + this.imageTime }
        },
        false,
        false
      ); // 不合并、不动画
    }
  }
};
</script>

<style scoped>
/* .myChart-container {
  width: 100%;
  margin: 0;
  padding: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
} */
</style>
