<template>
  <div v-if="stateInfo" class="radar-state-info">
    <h3>雷达状态信息</h3>
    <p><strong>设备ID:</strong> {{ stateInfo.radarkey || "-" }}</p>
    <p><strong>时间戳:</strong> {{ formatTimestamp(stateInfo.timestamp) || "-" }}</p>
    <p><strong>命令码:</strong> {{ stateInfo.command_code || "-" }}</p>
    <p><strong>磁盘总容量:</strong> {{ formatBytes(stateInfo.disk_total) || "-" }}</p>
    <p><strong>磁盘剩余容量:</strong> {{ formatBytes(stateInfo.disk_free) || "-" }}</p>
    <p><strong>内存总容量:</strong> {{ formatBytes(stateInfo.ram_total) || "-" }}</p>
    <p><strong>内存剩余容量:</strong> {{ formatBytes(stateInfo.ram_free) || "-" }}</p>
    <p><strong>SIM卡状态:</strong> {{ formatSimState(stateInfo.sim_state) || "-" }}</p>
    <p><strong>SIM接收信号强度:</strong> {{ formatSimRSSI(stateInfo.sim_RSSI) || "-" }}</p>
    <p><strong>电池状态:</strong> {{ formatBatteryState(stateInfo.battery) || "-" }}</p>
    <p><strong>设备温度:</strong> {{ stateInfo.temperature ? stateInfo.temperature + "°C" : "-" }}</p>
    <p><strong>供电电流:</strong> {{ stateInfo.current ? stateInfo.current + "A" : "-" }}</p>
    <p><strong>设备主供电:</strong> {{ stateInfo.voltage ? stateInfo.voltage + "V" : "-" }}</p>
  </div>
</template>

<script>
import { getRadarStateInfo } from "@/api/admin/sys-radar";

export default {
  name: "RadarStateInfo",
  props: {
    radarid: {
      type: Number,
      required: true,
      default: 0
    }
  },
  data() {
    return {
      timer: null,
      stateInfo: {}
    };
  },
  watch: {
    radarid: {
      handler(newVal) {
        console.log("watch.handler:", newVal);
        // 清除之前的定时器
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }

        // 如果有新的radarid，则获取数据并设置定时器
        if (newVal) {
          console.log("RadarStateInfo.watch.newVal");
          this.fetchStateInfo();
          //TODO:
          // this.timer = setInterval(() => {
          //   this.fetchStateInfo();
          // }, 1000);
        }
      },
      immediate: true
    }
  },
  beforeDestroy() {
    // 组件销毁前清除定时器
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },
  methods: {
    fetchStateInfo() {
      if (!this.radarid) return;

      getRadarStateInfo({ radarId: this.radarid })
        .then(response => {
          this.stateInfo = response.data || {};
        })
        .catch(error => {
          console.error("获取雷达状态信息失败:", error);
          this.stateInfo = {}; // 清空显示内容
        });
    },

    formatTimestamp(timestamp) {
      if (!timestamp) return "-";
      // 将UTC时间戳转换为可读格式
      const date = new Date(timestamp * 1000);
      return date.toLocaleString();
    },

    formatBytes(bytes) {
      if (!bytes) return "-";
      // 格式化字节大小
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      if (bytes === 0) return "0 Bytes";
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
      return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
    },

    formatSimState(state) {
      if (state === undefined || state === null) return "-";
      return state === 0 ? "正常" : "异常";
    },

    formatSimRSSI(rssi) {
      if (rssi === undefined || rssi === null) return "-";
      if (rssi === 0) return "≤-115dBm";
      if (rssi === 1) return "-111dBm";
      if (rssi >= 2 && rssi <= 30) return "-109～-53dBm";
      if (rssi >= 31) return "≥-51dBm";
      return rssi;
    },

    formatBatteryState(state) {
      if (state === undefined || state === null) return "-";
      return state === 0 ? "充电中" : "放电中";
    }
  }
};
</script>

<style scoped>
.radar-state-info {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
  min-height: 300px; /* 设置最小高度以匹配RadarDeviceInfo */
}

.radar-state-info h3 {
  margin-top: 0;
  color: #333;
}

.radar-state-info p {
  margin: 5px 0;
  color: #666;
}
</style>
