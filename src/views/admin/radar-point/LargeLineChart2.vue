<template>
  <div class="chart-container">
    <!-- 折线图容器 -->
    <div ref="lineChart" style="width: 100%; height: 400px;"></div>
    
    <!-- 数据更新演示按钮 >
    <button @click="updateData">更新数据</button-->
  </div>
</template>

<script>
// 完整引入方式
import echarts from 'echarts'
import {fastFormatDate} from '@/utils/time'

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
      xAxisData: Array.from({length: 2000}, (_, i) => i),
      seriesData: [
        { name: '距离值', data: Array.from({length: 2000}, (_, i) => i)}
      ],
      currentMark: null  // 当前标记区域缓存
    }
  },
  props: {
    imageData: {
      type: Array,
      required: true
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
      this.chart.off('click', this.handleChartClick)
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
          text: '当前雷达最新影像数据',
          left: 'center'
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
          data: this.xAxisData,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value'
        },
        series: this.seriesData.map(item => ({
          name: item.name,
          type: 'line',
          data: item.data,
          smooth: false,
          large: true,
          sampling: 'lttb',
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.01)' }
            ])
          },
          markPoint: {
            symbol: 'rect',
            symbolSize: [5, 10],
            itemStyle: {
              color: 'rgba(255, 0, 0, 0.3)',
              borderWidth: 0
            },
            label: { show: false },
            data: [{
                  coord: [500, 200],
                  symbolOffset: [0, 0] // 确保中心点对齐
                }]
          },
          markArea: {
            silent: false,  // 不触发事件
            itemStyle: {
              color: 'rgba(255,165,0,0.1)',
              borderWidth: 1,
              borderColor: '#FFA500'
            },
            data: []
          }
        })),
        dataZoom: [{
          type: 'inside',
          start: 0,
          end: 100,
          // 解决缩放时的索引计算问题
          filterMode: 'none'
        }]
      }

      this.chart.setOption(option)
      this.bindClickEvent()
    },
    
    emitImageIndexClick(index) {
        this.$emit('ImageIndexClick', {index:index});
    },
    bindClickEvent() {
      this.chart.off('click')
      this.chart.on('click', params => {
        console.log('click',params)
        if(params.componentType==='series')
        {
          if(params.componentSubType==='line')
          {
            this.handleXAxisClick(params)
          }
        }else if (params.componentType==='markArea')
        {
          this.emitImageIndexClick(params.data.centerIndex)
        }
        //if (params.componentType === 'xAxis') {
          //this.handleXAxisClick(params)
        //}
      })
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
    handleXAxisClick(params) {
      console.log('handleXAxisClick',params)
      const xIndex = params.dataIndex  // 获取点击的原始索引值
      const startIdx = Math.max(0, xIndex - 2)
      const endIdx = Math.min(this.xAxisData.length - 1, xIndex + 2)
      
      // 获取Y轴范围
      // 获取当前Y轴的最大值（图表顶部的值）
      const option = this.chart.getOption();
      const yAxis = option.yAxis[0];
      // 如果Y轴设置了max值，使用它；否则获取当前视图中Y轴的实际最大值
      const yMax = yAxis.max || (yAxis.scale ? Math.max(...this.seriesData[0].data) : this.chart.getModel().getComponent('yAxis', 0).axis.scale.getExtent()[1]);
      const yValue = yMax;
      const yStart = 0
      const yEnd = yValue + 10

      this.currentMark = [
        {
          centerIndex:xIndex,
          xAxis: startIdx,
          yAxis: yStart,
          itemStyle: { color: '#ffff00' } // 隐藏起点标记
        },
        {
          xAxis: endIdx,
          yAxis: yEnd,
          itemStyle: { color: '#ffff00' } // 隐藏终点标记
        }
      ]

      this.updateMarkArea()
    },
    // 处理窗口大小变化
    handleResize() {
      this.chart?.resize()
    },

    // 模拟数据更新
    updateData() {
      this.handleResize()
      this.seriesData = this.seriesData.map(series => ({
        ...series,
        data: this.imageData//.map(() => Math.floor(Math.random() * 300))
      }))
      this.xAxisData = this.imageData.map((_, index) => index) // 修改点2：动态更新索引
      this.chart.setOption({
        xAxis: {
          data: this.xAxisData
        },
        title: {
          text: '当前雷达最新影像数据'+fastFormatDate(new Date(this.imageTime)),
        },})
    }
  },

  watch: {
    imageData: {
      handler(newVal) {
        if (this.chart) {
          this.updateData()
        }
      },
      deep: true
    },
    // 深度监听数据变化
    seriesData: {
      handler(newVal) {
        if (this.chart) {
          this.chart.setOption({
            series: newVal.map(item => ({
              name: item.name,
              data: item.data
            }))
          })
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped>
.chart-container {
  width: 100wh;
  margin: 0px auto;
  padding: 0px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

button {
  margin-top: 20px;
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