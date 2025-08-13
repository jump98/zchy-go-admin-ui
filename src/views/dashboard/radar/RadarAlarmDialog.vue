<template>
  <div class="radar-alarm-dialog">
    <el-dialog
      :title="`雷达 ${radarInfo.radarName} 告警信息`"
      :visible.sync="dialogVisible"
      width="60%"
      :before-close="handleClose"
    >
      <div v-if="alarmData && alarmData.length > 0">
        <el-table :data="alarmData" style="width: 100%" max-height="400">
          <el-table-column label="告警时间" width="180">
            <template slot-scope="scope">
              {{ formatDateTime(new Date(scope.row.SvrTime)) }}
            </template>
          </el-table-column>
          <el-table-column prop="RadarId" label="雷达ID" width="120"></el-table-column>
          <el-table-column prop="TimeStamp" label="时间戳" width="120"></el-table-column>
          <el-table-column prop="Voltage" label="电压"></el-table-column>
          <el-table-column prop="Temperature" label="温度"></el-table-column>
          <el-table-column prop="Battery" label="电池"></el-table-column>
          <el-table-column prop="SolarPanel" label="太阳能板"></el-table-column>
          <el-table-column prop="RadarData" label="雷达数据"></el-table-column>
        </el-table>
      </div>
      <div v-else>
        <p>暂无告警信息</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="loadPreviousPage" :disabled="loading">上一页</el-button>
        <el-button @click="loadNextPage" :disabled="loading">下一页</el-button>
        <el-button @click="handleClose">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getRadarAlarmsBefore } from '@/api/admin/sys-radar';

export default {
  name: 'RadarAlarmDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    radarInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      dialogVisible: this.visible,
      alarmData: [],
      loading: false,
      currentPageTime: null,
      historyTimes: [] // 用于存储历史查询时间的栈
    };
  },
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal;
      if (newVal) {
        this.loadNextPage();
      }
    }
  },
  methods: {
    // 格式化日期时间
    formatDateTime(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    handleClose() {
      this.dialogVisible = false;
      this.$emit('update:visible', false);
      // 重置状态
      this.alarmData = [];
      this.currentPageTime = null;
      this.historyTimes = [];
    },
    async loadNextPage() {
      this.loading = true;
      try {
        // 构造请求参数
        const params = {
          num: 100,
          radarId: this.radarInfo.radarId,
          time: this.currentPageTime || this.formatDateTime(new Date())
        };
        
        const response = await getRadarAlarmsBefore(params);
        
        if (response.code === 200) {
          if (response.data && response.data.length > 0) {
            // 保存当前时间到历史栈
            if (this.currentPageTime) {
              this.historyTimes.push(this.currentPageTime);
            }
            
            // 更新当前页时间，用于下一页查询
            const lastItem = response.data[response.data.length - 1];
            this.currentPageTime = this.formatDateTime(new Date(lastItem.SvrTime));
            this.alarmData = response.data;
          } else {
            // 如果没有数据，提示用户
            this.$message.info('没有更多数据了');
          }
        } else {
          this.$message.error(response.msg || '获取告警数据失败');
        }
      } catch (error) {
        this.$message.error('获取告警数据时发生错误');
        console.error('Error fetching alarm data:', error);
      } finally {
        this.loading = false;
      }
    },
    async loadPreviousPage() {
      // 实现上一页功能
      if (this.historyTimes.length > 0) {
        this.loading = true;
        try {
          // 从历史时间栈中取出上一个时间
          const previousTime = this.historyTimes.pop();
          
          // 构造请求参数
          const params = {
            num: 100,
            radarId: this.radarInfo.radarId,
            time: previousTime
          };
          
          const response = await getRadarAlarmsBefore(params);
          
          if (response.code === 200) {
            if (response.data && response.data.length > 0) {
              // 更新当前页时间
              const lastItem = response.data[response.data.length - 1];
              this.currentPageTime = this.formatDateTime(new Date(lastItem.SvrTime));
              this.alarmData = response.data;
            } else {
              // 如果没有数据，提示用户
              this.$message.info('没有更多数据了');
            }
          } else {
            this.$message.error(response.msg || '获取告警数据失败');
          }
        } catch (error) {
          this.$message.error('获取告警数据时发生错误');
          console.error('Error fetching alarm data:', error);
        } finally {
          this.loading = false;
        }
      } else {
        this.$message.info('已经是第一页了');
      }
    }
  }
};
</script>

<style scoped>
.radar-alarm-dialog {
  /* 可以添加一些样式 */
}
</style>