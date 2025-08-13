<template>
  <div class="chart-container">
    <!-- 折线图容器 -->
    <div ref="lineChart" style="width: 100wh; min-height:150px;height: 100%;"></div>
    
    <!-- 数据更新演示按钮 >
    <button @click="updateData">更新数据</button-->
  </div>
</template>

<script>
// 完整引入方式
import echarts from 'echarts'
// 按需引入（推荐）
// import echarts from 'echarts/lib/echarts'
// import 'echarts/lib/chart/line'
// import 'echarts/lib/component/title'
// import 'echarts/lib/component/tooltip'
// import 'echarts/lib/component/grid'
// import 'echarts/lib/component/legend'

export default {
  data() {
    return {
      chart: null,
      xAxisData: [],
      seriesData: [
        { name: '形变值', data: []}
      ],
      currentMark: null  // 当前标记区域缓存
    }
  },
  props: {
    imageData: {
      type: Array,
      default: () => []
    },
    pointIndex: {
      type: Number,
      default: 0
    },
    radarName: {
      type: String,
      default: ''
    },
    imageTime:''
  },

  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    if (this.chart) {
      this.chart.dispose()
      this.chart = null
    }
  },

  methods: {
    // 初始化图表
    initChart() {
      this.chart = echarts.init(this.$refs.lineChart)
      
      const option = {
        animation: false,
        title: {
          text: this.radarName + ' - 监测点: ' + this.pointIndex,
          textStyle: {
            color: '#fff',
            fontSize: 16
          },
          left: 'center'
        },
        textStyle: {
          color: '#fff',  // 默认文本颜色
          //fontSize: 12
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        // legend: {
        //   data: this.seriesData.map(item => item.name),
        //   top: 30
        // },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.imageData ? this.imageData.map(item => new Date(item.SvrTime).toLocaleTimeString()) : [],
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          boundaryGap: [0, '100%']
        },
        series: [{
          name: '形变值',
          type: 'line',
          data: this.imageData ? this.imageData.map(item => item.Deformation) : [],
          smooth: false,
          large: true,
          sampling: 'lttb',
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ])
          },
        }],
        dataZoom: [{
          type: 'inside',
          start: 0,
          end: 100,
          // 解决缩放时的索引计算问题
          filterMode: 'none'
        },
        {
          start: 0,
          end: 10
        }
      ]
      }

      this.chart.setOption(option)
    },
    
    updateMarkArea() {
      console.log('updateMarkArea',this.currentMark)
      this.chart.setOption({
        series: [{
          markArea: {
            data: [this.currentMark],
            animation: false
          }
        }]
      })
    },
    // 处理窗口大小变化
    handleResize() {
      this.chart?.resize()
    },

    // 模拟数据更新
    updateData() {
      this.handleResize()
      // Create a copy of the prop data to avoid direct mutation
      const imageDataCopy = [...this.imageData];
      this.seriesData = this.seriesData.map(series => ({
        ...series,
        data: imageDataCopy.map(() => Math.floor(Math.random() * 300))
      }))
    }
  },

  watch: {
    imageData: {
      handler(newVal) {
        if (this.chart) {
          this.handleResize()
          // 更新xAxis和series的数据
          this.chart.setOption({
            title: {
              text: this.radarName + ' - 监测点: ' + this.pointIndex
            },
            xAxis: {
              data: newVal ? newVal.map(item => new Date(item.SvrTime).toLocaleTimeString()) : []
            },
            series: [{
              type: 'line',
              data: newVal ? newVal.map(item => item.Deformation) : []
            }]
          });
        }
      },
      deep: true
    },
    pointIndex: {
      handler(newVal) {
        if (this.chart) {
          this.chart.setOption({
            title: {
              text: this.radarName + ' - 监测点: ' + newVal
            }
          });
        }
      }
    },
    radarName: {
      handler(newVal) {
        if (this.chart) {
          this.chart.setOption({
            title: {
              text: newVal + ' - 监测点: ' + this.pointIndex
            }
          });
        }
      }
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100wh;
  margin: 0;
  padding: 0px;
  background: #333333aa;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

button {
  margin: 0px;
  padding: 8px 16px;
  background: #409EFF;
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