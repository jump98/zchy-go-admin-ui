
<template>
    <LargeLineChart :imageData="chartData" :imageTime="svrTime"
    @ImageIndexClick="onImageIndexClick"
    />
</template>

<script>
    import LargeLineChart from './LargeLineChart2'
    import {getSysRadarImage } from '@/api/admin/sys-radar'

    export default {
        name: 'RadarImage',
        props: {
            radarid: 0
        },
        components: {
            LargeLineChart
        },
        data() {
            return {
                timerId: null,
                chartData: [], // 你的2000条数据数组
                svrTime:''
            }
        },
        created() {
            // 生成示例数据（2000个随机数）
            this.chartData = Array.from({ length: 200 }, () => 
                Math.floor(Math.random() * 1000)
            )
        },
        mounted() {
            this.startTimer()
        },
        beforeDestroy() {
            if(this.timerId)
            {
                clearTimeout(this.timerId) // 清除定时器
            }
        },
        methods: {
            emitAddRadarPoint(index) {
                this.$emit('sigAddRadarPoint', index);
            },
            onImageIndexClick(data){
                console.log('onImageIndexClick',data)
                this.emitAddRadarPoint(data)
            },
            /** 查询参数列表 */
            GetImageData(radarid) {
                let that=this
                //console.log('GetImageData radarid=',radarid)
                if (radarid===undefined)return
                getSysRadarImage(radarid).then(res=>{
                    //console.log('getSysRadarImage:',res)
                    //that.chartData=res.data.EchoData
                    that.chartData=res.data.Data
                    that.svrTime=res.data.SvrTime
                })
            },
            startTimer() {
                let that=this
                this.timerId = setTimeout(() => {
                    //console.log("Timer executed");
                    that.GetImageData(that.radarid)
                    that.startTimer()
                }, 1000);
            },
        },
        watch: {
            radarid: {
                handler(newVal) {
                    console.log("RadarImage.vue.radarid=",newVal)
                    this.GetImageData(newVal)
                },
                deep: true
            },
        }
    }
</script>
