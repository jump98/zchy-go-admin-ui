<template>
  <div id="app">
    <CesiumMap @radar-click="showRadarPopup" />

    <el-dialog :visible.sync="popupVisible" :title="radarInfo.name" width="400px" center>
      <div>
        <p>{{ radarInfo.description }}</p>
        <p>经纬度: {{ radarInfo.longitude }}, {{ radarInfo.latitude }}</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="popupVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import CesiumMap from "../index.vue";

export default {
  components: { CesiumMap },
  data() {
    return {
      popupVisible: false,
      radarInfo: {}
    };
  },
  methods: {
    showRadarPopup(info) {
      console.log("雷达信息:", info);
      this.radarInfo = info;
      this.popupVisible = true;
    }
  }
};
</script>
