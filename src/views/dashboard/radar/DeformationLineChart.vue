<template>
  <el-dialog v-bind="$attrs" :title="title" width="80%" :close-on-click-modal="false" @open="onOpen" @close="onClose">
    <div class="chart-container">
      <!-- 折线图容器 -->
      <div ref="lineChart" style="width: 100%; height: 100%" />

      <!-- 数据更新演示按钮 >
    <button @click="updateData">更新数据</button-->
    </div>
  </el-dialog>
</template>

<script>
import { getRadarPointDeformData } from "@/api/admin/radar-point";
// 完整引入方式
import echarts from "echarts";
// 按需引入（推荐）
// import echarts from 'echarts/lib/echarts'
// import 'echarts/lib/chart/line'
// import 'echarts/lib/component/title'
// import 'echarts/lib/component/tooltip'
// import 'echarts/lib/component/grid'
// import 'echarts/lib/component/legend'

export default {
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
      imageData: [],
      title: "",
      chart: null,
      startTime: "2025-01-10 04:00:00",
      endTime: "2025-12-12 04:00:00",
      xAxisData: [],
      seriesData: [{ name: "形变值", data: [] }],
      currentMark: null // 当前标记区域缓存
    };
  },

  watch: {
    // imageData: {
    //   handler(newVal) {
    //     if (this.chart) {
    //       this.handleResize();
    //       // 更新xAxis和series的数据
    //       this.chart.setOption({
    //         title: {
    //           text: this.radarName + " - 监测点: " + this.pointIndex
    //         },
    //         xAxis: {
    //           data: newVal ? newVal.map(item => new Date(item.SvrTime).toLocaleTimeString()) : []
    //         },
    //         series: [
    //           {
    //             type: "line",
    //             data: newVal ? newVal.map(item => item.Deformation) : []
    //           }
    //         ]
    //       });
    //     }
    //   },
    //   deep: true
    // },
    // pointIndex: {
    //   handler(newVal) {
    //     if (this.chart) {
    //       this.chart.setOption({
    //         title: {
    //           text: this.radarName + " - 监测点: " + newVal
    //         }
    //       });
    //     }
    //   }
    // },
    // radarName: {
    //   handler(newVal) {
    //     if (this.chart) {
    //       this.chart.setOption({
    //         title: {
    //           text: newVal + " - 监测点: " + this.pointIndex
    //         }
    //       });
    //     }
    //   }
    // }
  },

  // 页面加载完成时触发
  mounted() {
    window.addEventListener("resize", this.handleResize);
  },
  // 组件销毁前
  beforeDestroy() {
    // window.removeEventListener("resize", this.handleResize);
    if (this.chart) {
      this.chart.dispose();
      this.chart = null;
    }
  },

  methods: {
    async onOpen() {
      console.log("radarInfo onOpen", this.radarInfo);
      console.log("radarPointInfo onOpen", this.radarPointInfo);

      let { radarName } = this.radarInfo;
      let { pointName } = this.radarPointInfo;
      this.title = `${radarName} - 监测点: ${pointName}`;

      try {
        await this.getRadarPointDeformData();
        this.initChart();
      } catch (error) {
        console.error("初始化报表出错：", error);
      }
    },
    onClose() {
      this.close();
    },
    close() {
      console.log("关闭close");
      this.$emit("update:visible", false);
    },

    // 获取变形点数据
    async getRadarPointDeformData() {
      let { radarId } = this.radarInfo;
      let { pointIndex } = this.radarPointInfo;

      let param = {
        devid: radarId,
        index: pointIndex,
        startTime: this.formatDateTime(this.startTime),
        endTime: this.formatDateTime(this.endTime)
      };
      let resp = await getRadarPointDeformData(param);
      if (resp.code === 200 && resp.data && resp.data.length > 0) {
        // 处理数据并更新图表
        const chartData = resp.data.map(item => ({
          SvrTime: new Date(item.SvrTime).getTime(),
          Deformation: item.Deformation
        }));
        console.log("chartData=", chartData);
        this.imageData = chartData;
      } else {
        this.imageData = [];
      }
    },
    // 格式化时间，将本地时间转换为UTC时间
    formatDateTime(dateTime) {
      if (!dateTime) return "";
      // 如果包含T，说明是datetime-local的值，需要转换为Date对象
      if (dateTime.includes("T")) {
        // 先将datetime-local的值转换为本地时间的Date对象
        const localDate = new Date(dateTime.replace("T", " ") + ":00");
        // 转换为UTC时间字符串
        return localDate.toISOString().slice(0, 19).replace("T", " ");
      } else {
        // 如果已经是标准格式，直接转换为UTC时间
        const localDate = new Date(dateTime);
        return localDate.toISOString().slice(0, 19).replace("T", " ");
      }
    },

    // 初始化图表
    initChart() {
      this.chart = echarts.init(this.$refs.lineChart);
      console.log("imageData", this.imageData);
      const option = {
        animation: false,
        title: {
          text: this.title,
          textStyle: {
            color: "#fff",
            fontSize: 16
          },
          left: "center"
        },
        textStyle: {
          color: "#fff" // 默认文本颜色
          // fontSize: 12
        },
        tooltip: {
          trigger: "axis",
          axisPointer: {
            type: "shadow"
          }
        },
        // legend: {
        //   data: this.seriesData.map(item => item.name),
        //   top: 30
        // },
        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: this.imageData ? this.imageData.map(item => new Date(item.SvrTime).toLocaleTimeString()) : [],
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: "value",
          boundaryGap: [0, "100%"]
        },
        series: [
          {
            name: "形变值",
            type: "line",
            data: this.imageData ? this.imageData.map(item => item.Deformation) : [],
            smooth: false,
            large: true,
            sampling: "lttb",
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(64, 158, 255, 0.5)" },
                { offset: 1, color: "rgba(64, 158, 255, 0.1)" }
              ])
            }
          }
        ],
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
            // 解决缩放时的索引计算问题
            filterMode: "none"
          },
          {
            start: 0,
            end: 10
          }
        ]
      };

      this.chart.setOption(option);
    },

    updateMarkArea() {
      console.log("updateMarkArea", this.currentMark);
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
    // 处理窗口大小变化
    handleResize() {
      this.chart?.resize();
    },

    // 模拟数据更新
    updateData() {
      // this.handleResize();
      // Create a copy of the prop data to avoid direct mutation
      const imageDataCopy = [...this.imageData];
      this.seriesData = this.seriesData.map(series => ({
        ...series,
        data: imageDataCopy.map(() => Math.floor(Math.random() * 300))
      }));
    }
  }
};
</script>

<style scoped>
/* .chart-container {
  margin: 0;
  padding: 0px;
  background: #333333aa;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
} */

button {
  margin: 0px;
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #66b1ff;
}
</style>
