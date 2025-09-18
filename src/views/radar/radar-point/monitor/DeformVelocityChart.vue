<template>
  <div>
    <!-- 查询参数UI -->
    <QueryParam :data-type="dataType" :time-hours="timeHours" :time-type="timeUnit" :show-data-type="false" @changeTimeEvent="onChangeTimeEvent" />

    <div class="myChart-container">
      <!-- 折线图容器 -->
      <div ref="lineChart" style="width: 100%; height: 400px" />
    </div>
  </div>
</template>

<script>
import { getDeformationVelocity } from "@/api/radar/radar-point";
import moment from "moment";
import QueryParam from "./QueryParam.vue";
// import { TestData } from "@/utils/test-demo";

// 按需引入（推荐，体积更小）
import { LineChart } from "echarts/charts";
import { DataZoomComponent, GridComponent, LegendComponent, MarkLineComponent, MarkPointComponent, TitleComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  //
  TooltipComponent,
  GridComponent,
  TitleComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
  MarkPointComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition
]);
export default {
  name: "DeformVelocityChart", // 形变速度
  components: { QueryParam },
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
      title: "",
      myChart: null, // 图表
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      timers: [], // 统一管理定时器
      maxDate: null, // 查询的最大时间
      seriesAData: [], // Max数据
      seriesBData: [], // Avg数据
      seriesCData: [], // Min数据
      closed: false, // 页面是否已关闭
      /** 默认查询开始时间 */
      startTime: moment().subtract(1, "hours"),
      /** 默认查询结束时间 */
      endTime: moment(),
      /** 默认查询N小时数据 */
      timeHours: 1,
      /** 数据类型[1=静态，2=动态[追加查询]] */
      dataType: 2, //
      /** 时间颗粒度类型：[seconds,minutes,hours,days] */
      timeUnit: "seconds"
    };
  },
  watch: {},
  // 页面加载完成时触发
  mounted() {
    this.init();
  },
  // 组件销毁前
  beforeDestroy() {
    this.clearData();
  },

  methods: {
    async init() {
      try {
        // console.log("radarInfo onOpen", this.radarInfo);
        // console.log("radarPointInfo onOpen", this.radarPointInfo);
        this.closed = false;
        this.initChart();
        window.addEventListener("resize", this.handleResize);
        await this.getRadarPointDeformList();
      } catch (error) {
        console.error("初始化报表出错：", error);
      }
    },
    clearData() {
      this.clearAllTimers();
      this.removeChart();
      this.maxDate = null;
      this.closed = true;
    },

    // 查询参数改变事件
    onChangeTimeEvent(event) {
      console.log("接受查询参数改变事件：", event);
      let { startTime, endTime, dataType, timeUnit, timeHours } = event;
      this.startTime = startTime;
      this.endTime = endTime;
      this.dataType = dataType;
      this.timeUnit = timeUnit;
      this.timeHours = timeHours;
      this.requeryRadarPointData();
    },

    // 重新查询形变数据
    async requeryRadarPointData() {
      this.maxDate = null;
      this.clearAllTimers(); // 先清理已有轮询
      this.clearChartData();
      await this.getRadarPointDeformList(); // 再发起新查询
    },

    // 获取变形点数据
    async getRadarPointDeformList() {
      const { radarId } = this.radarInfo;
      const { pointIndex } = this.radarPointInfo;
      let startTime = this.startTime;
      let endTime = this.endTime;
      let dataType = this.dataType;
      // console.log("startTime:", startTime.format(this.dateFormat));
      // console.log("endTime:", endTime.format(this.dateFormat));

      // 追加查询（当前最新时间数据）
      if (this.maxDate && dataType == 2) {
        let maxDate = moment(this.maxDate, this.dateFormat);
        if (startTime.isBefore(maxDate)) {
          startTime = maxDate;
          endTime = moment();
        }
      }
      const param = {
        radarId: radarId,
        index: pointIndex,
        startTime: moment(startTime).format(this.dateFormat),
        endTime: moment(endTime).format(this.dateFormat),
        hours: Number(this.timeHours), // 查询最近几小时（单位：小时）
        timeUnit: this.timeUnit
      };

      try {
        // 获取形变速率数据
        const resp = await getDeformationVelocity(param);
        if (!resp) return;
        let list = resp?.data?.list || [];
        let lastTime = resp?.data?.lastTime;

        // 后续需要改成RequestId来判断，比较靠谱
        if (this.timeHours != param.hours || this.timeUnit != param.timeUnit || this.dataType != dataType) {
          console.log("查询参数已经改变，查询结果丢弃");
          return;
        }
        // 测试数据
        // let resp = TestData.GetPointDeformData(this.timeUnit, this.seriesAData.length != 0, this.maxDate);
        // if (!resp) return;
        // let list = resp?.list || [];
        // let lastTime = resp?.lastTime;

        // console.log("查询形变数据结果", list);
        console.log("查询形变数据结果", list.length);
        if (list.length > 0) {
          // 如果有maxDate，防止插入重复数据
          if (this.maxDate) {
            let t1 = moment(lastTime, this.dateFormat);
            let t2 = moment(this.maxDate, this.dateFormat);
            if (t1.isSame(t2, this.timeUnit)) {
              console.log("查询的结果跟上一次的相同，不追加显示数据");
            } else {
              console.log("实时累加数据:", moment(list[0].time).format(this.dateFormat));
              this.appendChartData(list);
            }
          } else {
            this.appendChartData(list);
          }
          // 记录最后一条数据的时间 (之后append数据)
          this.maxDate = moment(lastTime).format(this.dateFormat);
        }

        if (list.length == 0 && this.seriesAData.length == 0) {
          this.$message({
            message: "当前查询时间没有形变数据",
            type: "warning",
            duration: 2000
          });
        }
        console.log("dataType :", dataType);
        // 追加查询
        if (dataType == 2) {
          this.addTimeout(() => this.getRadarPointDeformList(param), 1000);
        }
      } catch (error) {
        console.error("查询形变数据出错:", error);
        this.clearAllTimers();
      }
    },

    // 初始化图表
    initChart() {
      console.log("初始化图表");
      const option = {
        animation: false,
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          formatter: function (params) {
            return params
              .map(p => {
                let name = p.seriesName;
                return `${name}: ${p.value[1]}`;
              })
              .join("<br/>");
          }
        },
        grid: {
          bottom: 120, // 增加图表底部内边距，为X轴和时间显示留出更多空间
          left: "3%" // ← 绘图区距离容器左边 3%
        },
        title: {
          text: `速度曲线 - ${this.radarPointInfo.pointName}`,
          left: "center"
        },
        xAxis: {
          type: "time",
          name: "时间",
          position: "bottom", // X 轴固定在底部
          boundaryGap: false,
          axisLine: {
            onZero: false // 关闭与 y=0 对齐
          }
        },
        yAxis: {
          name: "速度(mm/s)",
          type: "value",
          position: "bottom",
          boundaryGap: false, // 控制坐标轴两端是否留白
          axisLabel: {
            formatter: "{value}"
          }
        },
        // legend: {
        //   // 设置图例在顶部
        //   // bottom: 100 // 距离容器顶部的距离，单位为px
        //   data: ["Max", "Avg", "Min"]
        // },
        // series: [],
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
            end: 100,
            bottom: 50
          }
        ]
      };
      this.myChart = echarts?.init(this.$refs.lineChart);
      this.myChart?.setOption(option);

      this.bindClickEvent();
    },

    //
    bindClickEvent() {},
    /** 销毁图表 */
    removeChart() {
      window.removeEventListener("resize", this.handleResize);
      this.seriesAData = [];
      this.seriesBData = [];
      this.seriesCData = [];
      if (this.myChart) {
        this.myChart.dispose();
        this.myChart = null;
      }
    },

    appendChartData(data = []) {
      if (!data || data.length === 0) return;
      this.handleResize();

      // 1. 格式化 series 数据，时间用 Date 对象
      const newSeriesAData = data.map(item => [new Date(item.time), item.max.toFixed(4)]);
      const newSeriesBData = data.map(item => [new Date(item.time), item.avg.toFixed(4)]);
      const newSeriesCData = data.map(item => [new Date(item.time), item.min.toFixed(4)]);

      // for (const item of newSeriesAData) {
      //   console.log("打印:", moment(item[0]).format(this.dateFormat), "形变值:", item[1]);
      // }

      let addCount = data.length;
      // A数据
      if (this.seriesAData.length > newSeriesAData.length && this.seriesAData.length > 100) this.seriesAData.splice(0, addCount);
      this.seriesAData.push(...newSeriesAData);
      // B数据
      if (this.seriesBData.length > newSeriesBData.length && this.seriesBData.length > 100) this.seriesBData.splice(0, addCount);
      this.seriesBData.push(...newSeriesBData);
      // C数据
      if (this.seriesCData.length > newSeriesCData.length && this.seriesCData.length > 100) this.seriesCData.splice(0, addCount);
      this.seriesCData.push(...newSeriesCData);

      let xAxisOption = {
        type: "time",
        axisLine: {
          onZero: false // 关闭与 y=0 对齐
        },
        boundaryGap: false, // 防止自动留白生成额外刻度
        minInterval: (() => {
          switch (this.timeUnit) {
            case "days":
              return 3600 * 1000 * 24; // 最小 12 小时一个刻度
            case "hours":
              return 60 * 60 * 2000; // 最小 1 小时
            case "minutes":
              return 60 * 1000; // 最小 1 分钟
            case "seconds":
            default:
              return 1000; // 最小 1 秒
          }
        })(),
        axisLabel: {
          formatter: value => {
            const m = moment(value);
            switch (this.timeUnit) {
              case "days":
                // 年月日 → 一行
                return m.format("YYYY-MM-DD");
              case "hours":
                // 月日 / 小时
                return m.format("YYYY-MM-DD") + "\n" + m.format("HH:00");
              case "minutes":
                // 月日 / 时:分
                return m.format("YYYY-MM-DD") + "\n" + m.format("HH:mm");
              case "seconds":
              default:
                // 月日 / 时:分:秒
                return m.format("YYYY-MM-DD") + "\n" + m.format("HH:mm:ss");
            }
          }
        }
      };
      // if (this.dataType == 1) {
      xAxisOption.min = new Date(this.seriesAData[0][0]);
      xAxisOption.max = new Date(this.seriesAData[this.seriesAData.length - 1][0]);
      // }

      let legendData = ["最大值", "平均值", "最小值"];
      let seriesOption = [
        {
          name: "最大值",
          type: "line", // 折线图
          yAxisIndex: 0,
          sampling: "lttb", // 降采样
          showSymbol: this.seriesAData.length <= 1,
          data: this.seriesAData
        },
        {
          name: "平均值",
          type: "line", // 折线图
          yAxisIndex: 0,
          sampling: "lttb", // 降采样
          showSymbol: this.seriesBData.length <= 1,
          data: this.seriesBData
        },
        {
          name: "最小值",
          type: "line", // 折线图
          yAxisIndex: 0,
          sampling: "lttb", // 降采样
          showSymbol: this.seriesCData.length <= 1,
          data: this.seriesCData
        }
      ];

      // 如果是查询最近1小时且时间颗粒度为秒，则只显示平均曲线
      if (this.timeHours == "1" && this.timeUnit == "seconds") {
        legendData = ["速度曲线"];
        seriesOption = [
          {
            name: "速度曲线",
            type: "line", // 折线图
            yAxisIndex: 0,
            sampling: "lttb", // 降采样
            showSymbol: this.seriesBData.length <= 1,
            data: this.seriesBData
          }
        ];
      }

      // 4. 更新图表
      this.myChart?.setOption(
        {
          xAxis: xAxisOption,
          series: seriesOption,
          legend: {
            data: legendData
          }
        },
        false,
        false
      ); // false, false 表示不合并，不动画
    },

    /** 清空表格数据数据 */
    clearChartData() {
      this.seriesAData = [];
      this.seriesBData = [];
      this.seriesCData = [];
      this.handleResize();
      this.myChart?.setOption(
        {
          xAxis: [],
          series: [{ data: [] }, { data: [] }, { data: [] }]
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
      // if (this.timers.length > 0) return;
      if (this.closed) return;
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
      console.log("DeformDataChart.所有轮询已停止");
    }
  }
};
</script>

<style scoped></style>
