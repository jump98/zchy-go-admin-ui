<template>
  <el-dialog v-bind="$attrs" :title="title" width="80%" :close-on-click-modal="false" @opened="onOpen" @close="onClose">
    <el-form :inline="true">
      <el-form-item>
        <el-radio-group v-model="queryRadio" size="mini" @input="onRadioInputEvent">
          <el-radio-button label="1">1小时</el-radio-button>
          <el-radio-button label="3">3小时</el-radio-button>
          <el-radio-button label="6">6小时</el-radio-button>
          <el-radio-button label="12">12小时</el-radio-button>
          <el-radio-button label="24">1天</el-radio-button>
          <el-radio-button :label="24 * 3">3天</el-radio-button>
          <el-radio-button :label="24 * 7">7天</el-radio-button>
          <el-radio-button :label="24 * 14">14天</el-radio-button>
          <el-radio-button label="-1">自定义</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="queryRadio == -1">
        <el-date-picker
          v-model="inputDate"
          size="mini"
          type="datetimerange"
          format="yyyy-MM-dd HH:mm:ss"
          value-format="yyyy-MM-dd HH:mm:ss"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          align="right"
          @change="onChangeTimeEvent"
        />
      </el-form-item>
    </el-form>

    <el-row>
      <div class="myChart-container">
        <!-- 折线图容器 -->
        <div ref="lineChart" style="width: 100%; height: 400px" />
      </div>
    </el-row>
  </el-dialog>
</template>

<script>
import { getRadarPointDeformData } from "@/api/admin/radar-point";
import moment from "moment";

// 按需引入（推荐，体积更小）
import * as echarts from "echarts/core";
import { TooltipComponent, GridComponent, LegendComponent, TitleComponent, DataZoomComponent, MarkLineComponent, MarkPointComponent } from "echarts/components";
import { LineChart } from "echarts/charts";
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
  name: "DeformDataChart",

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
      myChart: null,
      dateFormat: "YYYY-MM-DD HH:mm:ss",
      timers: [], // 统一管理定时器
      queryRadio: "1", // 选择时间
      inputDate: [],
      maxDate: null, // 查询的最大时间
      seriesAData: [], // 形变数据
      seriesBData: [], // 表格数据
      closed: false // 页面是否已关闭
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
      try {
        // console.log("radarInfo onOpen", this.radarInfo);
        // console.log("radarPointInfo onOpen", this.radarPointInfo);
        let { radarName } = this.radarInfo;
        let { pointName } = this.radarPointInfo;
        this.title = `${radarName} - 监测点: ${pointName}`;
        this.closed = false;
        this.initChart();
        window.addEventListener("resize", this.handleResize);
        await this.getRadarPointDeformList();
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
      this.closed = true;
      this.$emit("update:visible", false);
      this.clearData();
    },

    // 清空数据
    clearData() {
      this.maxDate = null;
    },

    // 获取变形点数据
    async getRadarPointDeformList() {
      const { radarId } = this.radarInfo;
      const { pointIndex } = this.radarPointInfo;
      let { startTime, endTime } = this.getQueryDate();
      // console.log("startTime:", startTime.format(this.dateFormat));
      // console.log("endTime:", endTime.format(this.dateFormat));

      // 追加查询（当前最新时间数据）
      if (this.maxDate && this.queryRadio != -1) {
        let maxDate = moment(this.maxDate, this.dateFormat);
        if (startTime.isBefore(maxDate)) {
          startTime = maxDate;
          endTime = moment();
        }
      }

      const param = {
        devid: radarId,
        index: pointIndex,
        startTime: startTime.format(this.dateFormat),
        endTime: endTime.format(this.dateFormat),
        hours: Number(this.queryRadio) // 查询最近几小时（单位：小时）
      };

      try {
        const resp = await getRadarPointDeformData(param);
        console.log("resp:", resp);
        if (!resp) return;
        let list = resp?.data?.list || [];
        let last_time = resp?.data?.last_time;
        console.log("list:", list);
        console.log("list.leng:", list.length);
        console.log("list:", list);
        if (list.length > 0) {
          // 如果有maxDate，防止插入重复数据
          if (this.maxDate) {
            let t1 = moment(last_time, "YYYY-MM-DD HH:mm:ss");
            let t2 = moment(this.maxDate, "YYYY-MM-DD HH:mm:ss");
            if (t1.isSame(t2)) {
              console.log("查询的结果跟上一次的相同，不追加显示数据");
            } else {
              console.log("实时累加数据");
              this.appendChartData(list);
            }
          } else {
            this.appendChartData(list);
          }
          // 记录最后一条数据的时间 (之后append数据)
          this.maxDate = moment(last_time).format(this.dateFormat);
        }

        if (list.length == 0 && this.seriesAData.length == 0) {
          this.$message({
            message: "当前查询时间没有形变数据",
            type: "warning",
            duration: 2000
          });
        }
        // 非自定义查询时间，就轮询查询结果
        if (this.queryRadio != -1) {
          this.addTimeout(() => this.getRadarPointDeformList(param), 1000);
        }
      } catch (error) {
        console.error("查询形变数据出错:", error);
        this.clearAllTimers();
      }
    },

    // 获取选择的时间
    getQueryDate() {
      let queryRadio = this.queryRadio;
      let startTime = moment().subtract(queryRadio, "hours"); // 查询往前多少个小时
      let endTime = moment();

      // 自定义时间
      if (queryRadio == -1) {
        startTime = moment(this.inputDate[0]);
        endTime = moment(this.inputDate[1]);
      }
      return { startTime, endTime };
    },

    // 选择radio事件
    async onRadioInputEvent() {
      console.log("选择radio事件:", this.queryRadio);
      if (this.queryRadio == -1) return;
      await this.requeryRadarPointData();
    },

    // 选择时间事件
    async onChangeTimeEvent() {
      console.log("选择时间事件");
      await this.requeryRadarPointData();
    },

    // 重新查询形变数据
    async requeryRadarPointData() {
      this.maxDate = null;
      this.clearAllTimers(); // 先清理已有轮询
      this.clearChartData();
      await this.getRadarPointDeformList(); // 再发起新查询
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
                if (name === "A") name = "形变数据";
                if (name === "B") name = "距离数据";
                return `${name}: ${p.value[1]}`;
              })
              .join("<br/>");
          }
        },
        grid: {
          bottom: 120 // 增加图表底部内边距，为X轴和时间显示留出更多空间
        },
        title: {
          text: "形变数据",
          left: "center"
        },
        xAxis: {
          type: "time",
          name: "时间",
          position: "bottom", // X 轴固定在底部
          axisLine: {
            onZero: false // 关闭与 y=0 对齐
          }
        },
        yAxis: {
          name: "形变值(mm)",
          type: "value",
          position: "bottom",
          boundaryGap: false, // 控制坐标轴两端是否留白
          axisLabel: {
            formatter: "{value}"
          }
        },
        legend: {
          // 设置图例在顶部
          // bottom: 100 // 距离容器顶部的距离，单位为px
          data: ["A", "B"],
          selected: {
            A: true,
            B: false
          },
          formatter: function (name) {
            // 显示时把 A/B 转换为中文
            if (name === "A") return "形变数据";
            if (name === "B") return "距离数据";
            return name;
          }
        },
        series: [
          {
            name: "形变数据", // 系列名称，用于tooltip的显示
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

    bindClickEvent() {
      this.myChart.on("legendselectchanged", this.onLegendselectchanged);
    },
    // 监听legend事件
    onLegendselectchanged(params) {
      console.log("params:", params);
      if (params.name === "A") {
        this.myChart.setOption({
          legend: {
            selected: {
              A: params.selected["A"],
              B: false
            }
          },
          yAxis: {
            name: "形变值(mm)"
          },
          title: {
            text: "形变数据",
            left: "center"
          }
        });
      }
      if (params.name === "B") {
        this.myChart.setOption({
          legend: {
            selected: {
              A: false,
              B: params.selected["B"]
            }
          },
          yAxis: {
            name: "距离值(m)"
          },
          title: {
            text: "距离数据",
            left: "center"
          }
        });
      }
    },
    /** 销毁图表 */
    removeChart() {
      window.removeEventListener("resize", this.handleResize);
      this.seriesAData = [];
      this.seriesBData = [];
      if (this.myChart) {
        this.myChart.off("legendselectchanged", this.onLegendselectchanged);
        this.myChart.dispose();
        this.myChart = null;
      }
    },

    /** 追加图表数据 */
    appendChartData(data = []) {
      this.handleResize();
      // 数据
      let seriesAData = data.map(item => [item.SvrTime, item.Deformation / 100]); // 服务器存储的值*100
      let seriesBData = data.map(item => [item.SvrTime, item.Distance / 100]);

      // for (const item of seriesBData) {
      //   console.log("打印:", moment(item[0]).format(this.dateFormat), "形变值:", item[1]);
      // }
      // for (const item of seriesBData) {
      //   console.log("打印:", moment(item[0]).format(this.dateFormat), "距离值:", item[1]);
      // }
      let addCount = data.length;
      // A数据
      if (this.seriesAData.length > seriesAData.length) this.seriesAData.splice(0, addCount);
      this.seriesAData.push(...seriesAData);
      // B数据
      if (this.seriesBData.length > seriesBData.length) this.seriesBData.splice(0, addCount);
      this.seriesBData.push(...seriesBData);

      this.myChart?.setOption(
        {
          series: [
            {
              name: "A",
              type: "line",
              showSymbol: false, // 不显示点
              data: this.seriesAData
            },
            {
              name: "B",
              type: "line",
              showSymbol: false, // 不显示点
              data: this.seriesBData,
              markLine: {
                data: [
                  {
                    type: "average",
                    name: "Avg",
                    label: {
                      position: "end",
                      formatter: "{b}: {c}" // {b}=name, {c}=值
                    }
                  }
                ]
              }
            }
          ]
        },
        false,
        false
      ); // 不合并、不动画
    },

    /** 清空表格数据数据 */
    clearChartData() {
      this.seriesAData = [];
      this.seriesBData = [];
      this.handleResize();
      this.myChart?.setOption(
        {
          series: [{ data: [] }, { data: [] }]
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
