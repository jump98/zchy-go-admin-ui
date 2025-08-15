//token
const CesiumToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOTBkMzI4Mi1mNTU0LTQ4NTgtYjk2YS04NzQyM2M3NGQyOGQiLCJpZCI6MzMxOTM1LCJpYXQiOjE3NTUxNjMwNTh9.YFYP1reJq1AoDn2aYuI_-hrmjbK3yf3HhQO-OVV-yJ4";

//天地图Key
const tdtKey = "fa82c07b5ec6331934ebdd4d35468add";
// 服务负载子域
const subdomains = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"];

// 参考：https://www.cnblogs.com/wjw1014/p/17140262.html

//引用public下面的Cesium.js
let Cesium = window["Cesium"];

class tCesiem {
  eventHandler; //事件handler

  /**
   * 创建天地图（2D 平面）
   * @param {*} dom 容器 DOM
   * @returns Cesium Viewer
   *
   */
  async NewTCesium(dom) {
    if (!Cesium) {
      console.error("Cesium is not loaded");
      return;
    }

    // Cesium Ion 默认访问令牌（可选）
    Cesium.Ion.defaultAccessToken = CesiumToken;

    // 创建 Cesium Viewer（2D 平面）
    const viewer = new Cesium.Viewer(dom, {
      imageryProvider: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: true,
      timeline: false,
      animation: false,
      sceneModePicker: true,
      navigationHelpButton: false,
      terrain: undefined,
      sceneMode: Cesium.SceneMode.SCENE2D
    });

    // 相机控制设置
    const controller = viewer.scene.screenSpaceCameraController;
    controller.minimumZoomDistance = 100; // 最近 100 米
    controller.maximumZoomDistance = 15000000; // 最远 1500 万米
    controller.zoomFactor = 10; // 每次滚轮缩放幅度 - 默认值：5

    const layers = viewer.imageryLayers;

    // ----------------------
    // 1️⃣ 低分辨率底图（快速显示全中国）
    // ----------------------
    const imgLow = new Cesium.WebMapTileServiceImageryProvider({
      url: "https://{s}.tianditu.gov.cn/img_w/wmts?" + "service=wmts&request=GetTile&version=1.0.0&LAYER=img&" + "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" + "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" + tdtKey,
      layer: "img",
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w",
      subdomains,
      minimumLevel: 1,
      maximumLevel: 5, // 低分辨率
      tileMatrixLabels: Array.from({ length: 6 }, (_, i) => String(i))
    });
    layers.addImageryProvider(imgLow);

    // ----------------------
    // 1️⃣ 低分辨率注记（文字标注，始终使用）
    // ----------------------
    const ciaLow = new Cesium.WebMapTileServiceImageryProvider({
      url: "https://{s}.tianditu.gov.cn/cia_w/wmts?" + "service=wmts&request=GetTile&version=1.0.0&LAYER=cia&" + "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" + "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" + tdtKey,
      layer: "cia",
      style: "default",
      format: "tiles",
      tileMatrixSetID: "w",
      subdomains,
      minimumLevel: 1,
      maximumLevel: 5, // 低分辨率注记
      tileMatrixLabels: Array.from({ length: 6 }, (_, i) => String(i))
    });
    layers.addImageryProvider(ciaLow);

    // ----------------------
    // 初始视角（全中国低分辨率）
    // ----------------------
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(104.0, 36.0, 10000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      }
    });

    // ----------------------
    // 分段飞行到目标位置
    // ----------------------
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(105.75563908, 29.35135961, 20000), // 中高空
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-80),
        roll: 0
      },
      duration: 1.5,
      complete: () => {
        // 飞到低空
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(105.75563908, 29.35135961, 1000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0
          },
          duration: 0.1,
          complete: () => {
            // ----------------------
            // 异步加载高分辨率底图和注记
            // ----------------------
            const imgHigh = new Cesium.WebMapTileServiceImageryProvider({
              url: "https://{s}.tianditu.gov.cn/img_w/wmts?" + "service=wmts&request=GetTile&version=1.0.0&LAYER=img&" + "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" + "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" + tdtKey,
              layer: "img",
              style: "default",
              format: "tiles",
              tileMatrixSetID: "w",
              subdomains,
              maximumLevel: 18,
              tileMatrixLabels: Array.from({ length: 19 }, (_, i) => String(i))
            });
            layers.addImageryProvider(imgHigh);

            // 注记
            const cia = new Cesium.WebMapTileServiceImageryProvider({
              url: "https://{s}.tianditu.gov.cn/cia_w/wmts?" + "service=wmts&request=GetTile&version=1.0.0&LAYER=cia&" + "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" + "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" + tdtKey,
              layer: "cia",
              style: "default",
              format: "tiles",
              tileMatrixSetID: "w",
              subdomains,
              maximumLevel: 18,
              tileMatrixLabels: Array.from({ length: 19 }, (_, i) => String(i))
            });
            layers.addImageryProvider(cia);
          }
        });
      }
    });

    return viewer;
  }

  /**
   * 监听鼠标移动事件
   * @param {*} viewer
   * @param {*} onMove
   * @returns
   */
  OnMouseMoveEvent(viewer, onMove) {
    // 创建事件处理器
    const handler = this.getHandler(viewer);
    // 监听鼠标移动
    handler.setInputAction(movement => {
      // 使用 pickEllipsoid 保证即使没地形/模型也能获取经纬度
      const cartesian = viewer.scene.pickPosition(movement.endPosition);
      // const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        // 回调传出经纬度
        onMove({ longitude: lon, latitude: lat });
      } else {
        onMove({ longitude: "", latitude: "" });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return handler; // 返回 handler 方便销毁
  }

  // 监听左键单击
  // handler.setInputAction(movement => {
  //   console.log("左键单击", movement);
  // }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // // 监听右键单击
  // handler.setInputAction(movement => {
  //   console.log("右键单击", movement);
  // }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

  // 监听滚轮
  // handler.setInputAction(movement => {
  //   console.log("滚轮事件", movement);
  // }, Cesium.ScreenSpaceEventType.WHEEL);

  //获得eventHandler
  getHandler(viewer) {
    let eventHandler = this.eventHandler;
    if (!eventHandler) {
      eventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      this.eventHandler = eventHandler;
    }
    return eventHandler;
  }
}

export const TCesiem = new tCesiem();
