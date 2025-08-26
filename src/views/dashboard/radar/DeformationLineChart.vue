<template>
  <el-dialog v-bind="$attrs" :title="title" width="80%" :close-on-click-modal="false" @opened="onOpen" @close="onClose">
    <el-form :inline="true">
      <el-form-item label="查询时间">
        <el-date-picker
          v-model="inputDate"
          type="datetimerange"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          :picker-options="pickerOptions"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          align="right"
          @change="onChangeTimeEvent"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="onClickQueryBtn">搜索</el-button>
      </el-form-item>
    </el-form>

    <el-row>
      <div class="myChart-container">
        <!-- 折线图容器 -->
        <div ref="lineChart" style="width: 100%; height: 400px" />
      </div>
    </el-row>

    <!-- 数据更新演示按钮 >
    <button @click="updateData">更新数据</button-->
  </el-dialog>
</template>

<script>
import { getRadarPointDeformData } from "@/api/admin/radar-point";
import moment from "moment";
// 按需引入（推荐，体积更小）
// 按需引入 ECharts 5
import * as echarts from "echarts/core";
import { TooltipComponent, GridComponent, LegendComponent, TitleComponent, DataZoomComponent } from "echarts/components";
import { LineChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([TooltipComponent, GridComponent, TitleComponent, LegendComponent, DataZoomComponent, LineChart, CanvasRenderer, UniversalTransition]);

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
      myChart: null,
      timers: [], // 统一管理定时器
      xAxisData: [],
      pickerOptions: {
        shortcuts: [
          {
            text: "今天",
            onClick(picker) {
              const start = moment().startOf("day").format("YYYY-MM-DD HH:mm:ss");
              const end = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");
              console.log("end:", end);
              console.log("start:", start);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "昨天",
            onClick(picker) {
              const start = moment().subtract(1, "days").startOf("day").format("YYYY-MM-DD HH:mm:ss");
              const end = moment().subtract(1, "days").endOf("day").format("YYYY-MM-DD HH:mm:ss");
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近一周",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
              console.log("end:", end);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近一个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
              picker.$emit("pick", [start, end]);
            }
          },
          {
            text: "最近三个月",
            onClick(picker) {
              const end = new Date();
              const start = new Date();
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
              picker.$emit("pick", [start, end]);
            }
          }
        ]
      },
      inputDate: [new Date()]
    };
  },
  watch: {},
  // 页面加载完成时触发
  mounted() {},
  // 组件销毁前
  beforeDestroy() {
    this.clearAllTimers();
    this.removeChart();
  },

  methods: {
    async onOpen() {
      // console.log("radarInfo onOpen", this.radarInfo);
      // console.log("radarPointInfo onOpen", this.radarPointInfo);

      let { radarName } = this.radarInfo;
      let { pointName } = this.radarPointInfo;
      this.title = `${radarName} - 监测点: ${pointName}`;

      this.initChart();
      window.addEventListener("resize", this.handleResize);

      let startTime = moment().subtract(1, "days").format("YYYY-MM-DD HH:mm:ss");
      let endTime = moment().endOf("day").format("YYYY-MM-DD HH:mm:ss");
      this.inputDate = [startTime, endTime];
      try {
        await this.getRadarPointList();
      } catch (error) {
        console.error("初始化报表出错：", error);
      }
    },
    onClose() {
      this.close();
    },
    close() {
      console.log("关闭close");
      this.clearAllTimers();
      this.removeChart();
      this.$emit("update:visible", false);
    },

    // 获取变形点数据
    async getRadarPointList() {
      const { radarId } = this.radarInfo;
      const { pointIndex } = this.radarPointInfo;

      const param = {
        devid: radarId,
        index: pointIndex,
        startTime: this.inputDate[0],
        endTime: this.inputDate[1]
      };

      try {
        const resp = await getRadarPointDeformData(param);
        const chartData = resp?.data || [];
        this.imageData = chartData;

        if (chartData.length === 0) {
          this.$message({
            message: "当前查询时间没有形变数据",
            type: "warning",
            duration: 2000
          });
        }

        this.updateData();
        console.log("查询this.timers:", this.timers);
        // 用统一管理的 addTimeout 轮询
        this.addTimeout(() => this.getRadarPointList(param), 1000);
      } catch (error) {
        console.error("查询形变数据出错:", error);
        this.clearAllTimers();
      }
    },

    // 选择日期
    onChangeTimeEvent() {},
    // 查询
    async onClickQueryBtn() {
      this.clearAllTimers(); // 先清理已有轮询
      await this.getRadarPointList(); // 再发起新查询
    },

    // 初始化图表
    initChart() {
      console.log("初始化图表:");
      const option = {
        animation: false,
        // title: {
        //   text: this.title,
        //   left: "center"
        // },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" }
        },

        xAxis: {
          type: "category",
          data: [],
          axisLabel: { rotate: 0 },
          name: "时间",
          position: "bottom" // X 轴固定在底部
        },
        yAxis: {
          name: "形变数据",
          type: "value"
          // boundaryGap: [0, "100%"]
        },

        series: [
          {
            // name: "雷达距离像数据", // 系列名称，用于tooltip的显示
            type: "line", // 折线图
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
          }
        ]
      };
      this.myChart = echarts?.init(this.$refs.lineChart);
      console.log("this.myChart:", this.myChart);
      this.myChart?.setOption(option);
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

    /** 更新数据 */
    updateData() {
      this.handleResize();
      // 距离像信号强度数据
      let data = this.imageData?.map(item => item.Deformation);
      // 下标点位
      let xAxisData = this.imageData?.map(item => moment(item.SvrTime).format("MM-DD HH:mm:ss"));
      this.myChart?.setOption(
        {
          xAxis: { data: xAxisData, position: "bottom" },
          series: [{ data: data }]
        },
        false,
        false
      ); // 不合并、不动画
    },

    // 处理窗口大小变化
    handleResize() {
      this.myChart?.resize();
    },
    // 添加定时器并保存到数组
    addTimeout(fn, delay) {
      if (this.timers.length > 0) return;

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
      console.log("  this.timers:", this.timers);
      this.timers.forEach(id => clearTimeout(id));
      this.timers = [];
      console.log("RadarImage.所有轮询已停止");
    }
  }
};
</script>

<style scoped>
/* .myChart-container {
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
