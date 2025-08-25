<template>
  <div class="chart-container">
    <!-- 折线图容器 -->
    <div ref="lineChart" style="width: 100%; height: 400px" />
  </div>
</template>

<script>
// 按需引入（推荐，体积更小）
import * as echarts from "echarts";

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
      chart: null,
      xAxisData: [],
      seriesData: [{ name: "距离值", data: [] }],
      currentMark: null // 当前标记区域缓存
    };
  },

  watch: {
    // imageTime变化时刷新数据（避免重复深度监听大数组）
    imageTime(newVal) {
      console.log("服务器时间：", newVal);
      this.refreshData();
    }
  },

  mounted() {
    console.log("chart.mounted");
    this.initChart();
    window.addEventListener("resize", this.handleResize);
  },

  beforeDestroy() {
    this.removeChart();
  },

  methods: {
    /** 刷新图表数据 */
    refreshData() {
      if (this.chart) {
        this.updateData();
      }
    },

    /** 销毁图表 */
    removeChart() {
      window.removeEventListener("resize", this.handleResize);
      if (this.chart) {
        this.chart.off("click");
        this.chart.dispose();
        this.chart = null;
      }
    },

    /** 初始化图表 */
    initChart() {
      this.chart = echarts.init(this.$refs.lineChart);

      const option = {
        animation: false,
        title: {
          text: "当前雷达最新影像数据",
          left: "center"
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "line" }
        },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: this.xAxisData,
          axisLabel: { rotate: 45 }
        },
        yAxis: { type: "value" },
        series: this.seriesData.map(item => ({
          name: item.name,
          type: "line",
          data: item.data,
          smooth: false,
          large: true, // 开启大数据优化
          sampling: "lttb", // 降采样
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 158, 255, 0.4)" },
              { offset: 1, color: "rgba(64, 158, 255, 0.01)" }
            ])
          },
          markArea: { data: [] }
        })),
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
            filterMode: "none"
          }
        ]
      };

      this.chart.setOption(option);
      this.bindClickEvent();
      this.handleResize();
    },

    /** 点击事件绑定 */
    bindClickEvent() {
      this.chart.off("click");
      this.chart.on("click", params => {
        if (params.componentType === "series" && params.componentSubType === "line") {
          this.handleXAxisClick(params);
        }
      });
    },

    /** 更新标记区域 */
    updateMarkArea() {
      this.chart.setOption({
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

    /** 处理点击 X 轴点 */
    handleXAxisClick(params) {
      const xIndex = params.dataIndex;
      const startIdx = Math.max(0, xIndex - 2);
      const endIdx = Math.min(this.xAxisData.length - 1, xIndex + 2);

      const option = this.chart.getOption();
      const yAxis = option.yAxis[0];
      const yMax = yAxis.max || Math.max(...this.seriesData[0].data);
      const yEnd = yMax + 10;

      this.currentMark = [
        {
          centerIndex: xIndex,
          xAxis: startIdx,
          yAxis: 0
        },
        {
          xAxis: endIdx,
          yAxis: yEnd
        }
      ];

      this.updateMarkArea();
      this.$emit("ImageIndexClick", { index: xIndex });
    },

    /** 窗口大小变化 */
    handleResize() {
      this.chart?.resize();
    },

    /** 更新数据 */
    updateData() {
      this.handleResize();
      const MAX_POINTS = 2000; // 限制最大点数
      const latestData = this.imageData.slice(-MAX_POINTS);

      this.seriesData[0].data = latestData;
      this.xAxisData = latestData.map((_, i) => i);
      console.log(" this.xAxisData :", this.xAxisData);
      this.chart.setOption(
        {
          xAxis: { data: this.xAxisData },
          series: [{ data: latestData }],
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
.chart-container {
  width: 100%;
  margin: 0;
  padding: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
</style>
