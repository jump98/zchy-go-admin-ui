<template>
  <div>
    <el-dialog v-bind="$attrs" :title="title" width="70%" :close-on-click-modal="false" @open="onOpen" @close="onClose">
      <el-descriptions v-if="radarInfo && deviceInfo" :column="4" title="雷达设备信息" direction="horizontal" border>
        <el-descriptions-item label="设备ID">{{ radarInfo.radarKey }}</el-descriptions-item>
        <el-descriptions-item label="设备名称">{{ radarInfo.radarName }}</el-descriptions-item>
        <el-descriptions-item label="逻辑程序版本">{{ deviceInfo.fpga_version }}</el-descriptions-item>
        <el-descriptions-item label="ARM固定版本">{{ deviceInfo.ps_version }}</el-descriptions-item>
        <el-descriptions-item label="激活状态">
          <el-tag v-if="radarInfo.status == '2'" type="success" size="small">已激活</el-tag>
          <el-tag v-else size="small" type="danger">未激活</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="系统镜像版本">{{ deviceInfo.image_version }}</el-descriptions-item>
        <el-descriptions-item label="生产序列号">{{ deviceInfo.serial_number }}</el-descriptions-item>
        <el-descriptions-item label="SIM卡IMEI号">{{ deviceInfo.sim_IMEI }}</el-descriptions-item>

        <el-descriptions-item label="厂商">{{ radarInfo.vender }}</el-descriptions-item>
        <el-descriptions-item label="经度">{{ radarInfo.lng }}</el-descriptions-item>
        <el-descriptions-item label="纬度">{{ radarInfo.lat }}</el-descriptions-item>
        <el-descriptions-item label="高程">{{ radarInfo.alt }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ radarInfo.remark }}</el-descriptions-item>
      </el-descriptions>

      <!-- <el-divider /> -->

      <el-descriptions v-if="radarInfo && stateInfo" :column="4" title="雷达状态信息" direction="horizontal" border style="margin-top: 20px">
        <!-- <el-descriptions-item label="设备ID">{{ radarInfo.radarKey }}</el-descriptions-item> -->
        <el-descriptions-item label="磁盘使用率" :span="1">
          <el-progress :stroke-width="15" :percentage="stateInfo.diskRatio" />
          <div>{{ formatDisk() }}</div>
          <!-- :format="formatDisk" -->
        </el-descriptions-item>

        <!-- <el-descriptions-item label="磁盘使用率">{{ formatBytes(stateInfo.disk_total) }}</el-descriptions-item> -->
        <!-- <el-descriptions-item label="磁盘剩余容量">{{ formatBytes(stateInfo.disk_free) }}</el-descriptions-item> -->
        <el-descriptions-item label="内存使用率">
          <el-progress :stroke-width="15" :percentage="stateInfo.MemoryRatio" />
          <div>{{ formatMemory() }}</div>
        </el-descriptions-item>
        <!-- <el-descriptions-item label="内存总容量">{{ formatBytes(stateInfo.ram_total) }}</el-descriptions-item> -->
        <!-- <el-descriptions-item label="内存剩余容量">{{ formatBytes(stateInfo.ram_free) }}</el-descriptions-item> -->
        <el-descriptions-item label="SIM卡状态">
          <el-tag v-if="stateInfo.sim_state === 0" type="success" size="small">正常</el-tag>
          <el-tag v-else size="small" type="danger">异常</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="SIM接收信号强度">{{ formatSimRSSI(stateInfo.sim_RSSI) }}</el-descriptions-item>

        <el-descriptions-item label="12V电压">{{ `${stateInfo.voltageObj["12V"]}V` }}</el-descriptions-item>
        <el-descriptions-item label="5.3V电压">{{ `${stateInfo.voltageObj["5V3"]}V` }}</el-descriptions-item>
        <el-descriptions-item label="2.1V电压">{{ `${stateInfo.voltageObj["2V1"]}V` }}</el-descriptions-item>
        <el-descriptions-item label="12V电流">{{ `${stateInfo.currentObj["12V"]}A` }}</el-descriptions-item>
        <el-descriptions-item label="主板温度">{{ `${stateInfo.temperatureObj["local"]}°C` }}</el-descriptions-item>
        <el-descriptions-item label="设备外壳温度">{{ `${stateInfo.temperatureObj["PCB"]}°C` }}</el-descriptions-item>
        <el-descriptions-item label="处理器温度">{{ `${stateInfo.temperatureObj["ZYNQ"]}°C` }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import moment from "moment";
import { getRadarDevInfo, getRadarStateInfo } from "@/api/admin/sys-radar";
export default {
  name: "RadarItemDialog",
  props: {
    radarInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      title: "",
      deviceInfo: null, // 设备信息
      stateInfo: null // 状态信息
    };
  },
  watch: {},
  methods: {
    onOpen() {
      console.log("RadarItem onOpen", this.radarInfo);
      let { dept, radarId } = this.radarInfo;
      this.title = dept.deptName;
      this.getRadarDeviceInfo(radarId);
      this.getRadarStateInfo(radarId);
    },
    onClose() {
      this.close();
    },
    close() {
      console.log("关闭close");
      this.$emit("update:visible", false);
    },
    // 查询设备信息
    async getRadarDeviceInfo(radarId) {
      const resp = await getRadarDevInfo({ radarId: radarId });
      this.deviceInfo = resp.data;
      let { SvrTime } = this.deviceInfo;
      this.deviceInfo.timeStr = moment(SvrTime).format("YYYY-MM-DD HH时mm分ss秒");
    },
    // 查询状态信息
    async getRadarStateInfo(radarId) {
      let resp = await getRadarStateInfo({ radarId });
      console.log("获取雷达状态信息:", resp);
      this.stateInfo = resp.data || {};
      let { voltage, current, temperature, disk_total, disk_free, ram_total, ram_free } = this.stateInfo;
      this.stateInfo.voltageObj = JSON.parse(voltage);
      this.stateInfo.temperatureObj = JSON.parse(temperature);
      this.stateInfo.currentObj = JSON.parse(current);
      this.stateInfo.diskRatio = this.calcDisk(disk_total, disk_free);
      this.stateInfo.MemoryRatio = this.calcMemory(ram_total, ram_free);
      console.log("voltageObj:", JSON.parse(voltage));
      console.log("temperature:", JSON.parse(temperature));
      console.log("this.stateInfo.current:", this.stateInfo.currentObj);
    },

    formatBytes(bytes) {
      if (!bytes) return "-";
      // 格式化字节大小
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
      if (bytes === 0) return "0 Bytes";
      const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
      return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
    },
    // 计算磁盘
    calcDisk(disk_total = 0, disk_free = 0) {
      if (!disk_total) return 0; // 避免除以 0
      let used = disk_total - disk_free;
      let ratio = (used / disk_total) * 100;
      console.log("磁盘使用率：", ratio.toFixed(0) + "%");
      return Math.round(ratio);
    },
    // 计算内存
    calcMemory(ram_total = 0, ram_free = 0) {
      if (!ram_total) return 0; // 避免除以 0
      let used = ram_total - ram_free;
      let ratio = (used / ram_total) * 100;
      console.log("内存使用率：", ratio.toFixed(0) + "%");
      return Math.round(ratio);
    },
    formatDisk() {
      let { disk_total, disk_free } = this.stateInfo;
      let total = this.formatBytes(disk_total);
      let free = this.formatBytes(disk_free);
      return `${free}可用，共${total}`;
    },
    formatMemory() {
      let { ram_total, ram_free } = this.stateInfo;
      let total = this.formatBytes(ram_total);
      let free = this.formatBytes(ram_free);
      return `${free}可用，共${total}`;
    },
    formatSimRSSI(rssi) {
      if (rssi === undefined || rssi === null) return "-";
      if (rssi === 0) return "≤-115dBm";
      if (rssi === 1) return "-111dBm";
      if (rssi >= 2 && rssi <= 30) return "-109～-53dBm";
      if (rssi >= 31) return "≥-51dBm";
      return `${rssi}dBm`;
    }
  }
};
</script>
