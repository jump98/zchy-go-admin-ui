<template>
  <div v-if="deviceInfo" class="radar-device-info">
    <h3>设备信息</h3>
    <p><strong>设备ID:</strong> {{ deviceInfo.radarkey }}</p>
    <p><strong>时间戳:</strong> {{ deviceInfo.timestamp }}</p>
    <p><strong>命令码:</strong> {{ deviceInfo.command_code }}</p>
    <p><strong>逻辑程序版本:</strong> {{ deviceInfo.fpga_version }}</p>
    <p><strong>ARM固定版本:</strong> {{ deviceInfo.ps_version }}</p>
    <p><strong>系统镜像版本:</strong> {{ deviceInfo.image_version }}</p>
    <p><strong>生产序列号:</strong> {{ deviceInfo.serial_number }}</p>
    <p><strong>SIM卡IMEI号:</strong> {{ deviceInfo.sim_IMEI }}</p>
  </div>
</template>

<script>
import { getRadarDevInfo } from "@/api/radar/sys-radar";

export default {
  name: "RadarDeviceInfo",
  props: {
    radarid: {
      type: Number,
      required: true,
      default: 0
    }
  },
  data() {
    return {
      deviceInfo: null,
      timer: null
    };
  },
  watch: {
    radarid: {
      handler(newVal) {
        if (!newVal) return;
        // if (this.timer) {
        //   clearInterval(this.timer);
        // }
        this.fetchDeviceInfo(newVal);
      },
      immediate: true
    }
  },
  beforeDestroy() {
    // if (this.timer) {
    //   clearInterval(this.timer);
    // }
  },
  methods: {
    async fetchDeviceInfo(radarId) {
      try {
        const resp = await getRadarDevInfo({ radarId: radarId });
        console.log("获得雷达设备信息:", resp.data);
        this.deviceInfo = resp.data;
      } catch (error) {
        console.error("获取设备信息失败:", error);
        this.deviceInfo = {}; // 清空显示内容
      }
    }
  }
};
</script>

<style scoped>
.radar-device-info {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.radar-device-info h3 {
  margin-top: 0;
  color: #333;
}

.radar-device-info p {
  margin: 5px 0;
  color: #666;
}
</style>
