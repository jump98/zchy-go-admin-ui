<template>
  <div id="map-container">
  </div>
</template>

<script>
export default {
  name: 'map',
  data() {
    return {
      sysInfo: ''
    }
  },
  created() {
  },
  mounted() {
    this.init()
  },
  destroyed() {
  },
  methods: {
    init() {
      this.viewer = new Cesium.Viewer("map-container", {
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false, // 影像切换
        animation: true, // 是否显示动画控件
        infoBox: false, // 是否显示点击要素之后显示的信息
        selectionIndicator: false, // 要素选中框
        geocoder: false, // 是否显示地名查找控件
        timeline: true, // 是否显示时间线控件
        fullscreenButton: false,
        shouldAnimate: false,
        navigationHelpButton: false, // 是否显示帮助信息控件
      });
    },
  }
}
</script>

<style lang="scss" scoped>
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;

</style>
