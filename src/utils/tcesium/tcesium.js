// token
const CesiumToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJkOTBkMzI4Mi1mNTU0LTQ4NTgtYjk2YS04NzQyM2M3NGQyOGQiLCJpZCI6MzMxOTM1LCJpYXQiOjE3NTUxNjMwNTh9.YFYP1reJq1AoDn2aYuI_-hrmjbK3yf3HhQO-OVV-yJ4";

// 天地图Key
const tdtKey = "fa82c07b5ec6331934ebdd4d35468add";
// 服务负载子域
const subdomains = ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"];

export const RadarTag = "radar-"; // 雷达实体tag
export const RadarPointTag = "point-"; // 雷达点实体tag

// 测试位置
// const testPosition = {
//   x: 105.75563908, // 经度
//   y: 29.35135961 // 纬度
// };

// 参考：https://www.cnblogs.com/wjw1014/p/17140262.html

// 引用public下面的Cesium.js
let Cesium = window["Cesium"];

class tCesiem {
  constructor() {
    console.error("tCesiem New");
  }

  /**
   * 创建天地图（2D 平面）
   * @param {*} dom m 容器 DOM
   * @param {*} pos 初始化雷达位置
   * @returns Cesium Viewer
   */
  async NewTCesium(dom, pos) {
    return new Promise((resolve, reject) => {
      if (!Cesium) {
        reject("Cesium is not loaded");
        return;
      }

      // Cesium Ion 默认访问令牌（可选）
      Cesium.Ion.defaultAccessToken = CesiumToken;

      // 创建 Cesium Viewer（2D 平面）
      const viewer = new Cesium.Viewer(dom, {
        imageryProvider: false, // 不加载默认底图（空底图）
        baseLayerPicker: false, // 隐藏底图选择器控件
        geocoder: false, // 隐藏搜索框（地名搜索）
        homeButton: false, // 隐藏 Home 按钮（回到默认视角）
        timeline: false, // 隐藏时间轴控件（Timeline）
        animation: false, // 隐藏动画控件（播放时间变化）
        sceneModePicker: false, // 隐藏场景模式切换按钮（2D/3D/Columbus View）
        navigationHelpButton: false, // 隐藏导航帮助按钮（右上角小问号）
        terrain: undefined, // 不加载地形，默认是平面
        sceneMode: Cesium.SceneMode.SCENE2D // 设置场景为 2D 平面模式
      });

      // 隐藏版权信息
      viewer._cesiumWidget._creditContainer.style.display = "none";

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
        url:
          "https://{s}.tianditu.gov.cn/img_w/wmts?" +
          "service=wmts&request=GetTile&version=1.0.0&LAYER=img&" +
          "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" +
          "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" +
          tdtKey,
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
        url:
          "https://{s}.tianditu.gov.cn/cia_w/wmts?" +
          "service=wmts&request=GetTile&version=1.0.0&LAYER=cia&" +
          "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" +
          "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" +
          tdtKey,
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
        destination: Cesium.Cartesian3.fromDegrees(pos.x, pos.y, 20000), // 中高空
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-80),
          roll: 0
        },
        duration: 1.5,
        complete: () => {
          // this.AddEntities(viewer); // 添加雷达实体

          // 飞到低空
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(pos.x, pos.y, 1000),
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
                url:
                  "https://{s}.tianditu.gov.cn/img_w/wmts?" +
                  "service=wmts&request=GetTile&version=1.0.0&LAYER=img&" +
                  "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" +
                  "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" +
                  tdtKey,
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
                url:
                  "https://{s}.tianditu.gov.cn/cia_w/wmts?" +
                  "service=wmts&request=GetTile&version=1.0.0&LAYER=cia&" +
                  "STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&" +
                  "TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=" +
                  tdtKey,
                layer: "cia",
                style: "default",
                format: "tiles",
                tileMatrixSetID: "w",
                subdomains,
                maximumLevel: 18,
                tileMatrixLabels: Array.from({ length: 19 }, (_, i) => String(i))
              });
              layers.addImageryProvider(cia);
              resolve(viewer);
            }
          });
        }
      });
    });
  }

  /**
   * 飞到指定位置
   * @param {*} viewer
   * @param {*} duration 飞行时间
   * @param {*} pos 指定地点
   * @param {*} callback 回调
   */
  FlyToPos(viewer, duration, pos, callback) {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(pos.x, pos.y, 1000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0
      },
      duration: duration,
      complete: () => {
        callback();
      }
    });
  }

  /**
   * 监听鼠标移动事件
   * @param {*} viewer
   * @param {*} callback
   * @returns
   */
  OnMouseMoveEvent(viewer, handler, callback) {
    // 监听鼠标移动
    handler.setInputAction(movement => {
      // 使用 pickEllipsoid 保证即使没地形/模型也能获取经纬度
      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        callback({ x: lon, y: lat });
      } else {
        callback({ x: "", y: "" });
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return;

    // 监听滚轮
    //  Cesium.ScreenSpaceEventType.WHEEL
  }

  /**
   * 监听鼠标左键点击事件
   * @param {*} viewer
   * @param {*} callback
   * @returns
   */
  OnMouseLifeClickEvent(viewer, handler, callback) {
    // 监听鼠标移动
    handler.setInputAction(movement => {
      const pickedObject = viewer.scene.pick(movement.position); // 获取点击的实体
      console.log("点击实物：", pickedObject);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        console.log("确保不弹窗");
        viewer.selectedEntity = undefined; // 确保不弹窗
        const cartesian = viewer.scene.pickPosition(movement.position);
        let pos = {};
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          pos.x = Cesium.Math.toDegrees(cartographic.longitude);
          pos.y = Cesium.Math.toDegrees(cartographic.latitude);
        }
        let { id, tag } = pickedObject.id;
        let resp = { id: id.slice(tag.length), tag, pos }; // id去掉前缀
        callback(resp); // 回调传出选中实体
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    return;
  }

  // 获得eventHandler
  getHandler(viewer) {
    let eventHandler = this.eventHandler;
    if (!eventHandler) {
      eventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      this.eventHandler = eventHandler;
    }
    return eventHandler;
  }

  // 添加雷达实体（适配航拍图）
  AddRadarEntities(viewer, pos, id, name) {
    const radarPosition = Cesium.Cartesian3.fromDegrees(pos.x, pos.y);

    viewer.entities.add({
      id: `${RadarTag}${id}`,
      name: name,
      position: radarPosition,
      tag: RadarTag,
      // 雷达图标（亮蓝色）
      billboard: {
        image: "/images/radar/radar2.png",
        width: 28,
        height: 28,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },

      // 雷达标签（黑色字体 + 白色半透明背景 + 自动缩放）
      label: {
        text: name,
        font: "bold 14px 'Microsoft YaHei', sans-serif",
        fillColor: Cesium.Color.BLACK,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 5), // 更靠近图标
        showBackground: true,
        backgroundColor: Cesium.Color.WHITE.withAlpha(0.65),
        backgroundPadding: new Cesium.Cartesian2(6, 4),
        scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 30000, 0.5),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1000000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }

  // 添加雷达点位实体（适配航拍图）
  AddRadarPointEntities(viewer, pos, id, name) {
    const pointPosition = Cesium.Cartesian3.fromDegrees(pos.x, pos.y);

    viewer.entities.add({
      id: `${RadarPointTag}${id}`,
      name: name,
      position: pointPosition,
      tag: RadarPointTag,
      // 点位图标（亮白色）
      billboard: {
        image: "/images/radar/radar_point1.1.png",
        width: 20,
        height: 20,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1,
        pixelOffset: new Cesium.Cartesian2(0, 0),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },

      // 点位标签（黑色字体 + 白色半透明背景 + 自动缩放）
      label: {
        text: name,
        font: "bold 12px 'Microsoft YaHei', sans-serif",
        fillColor: Cesium.Color.BLACK,
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        pixelOffset: new Cesium.Cartesian2(0, 5),
        showBackground: true,
        backgroundColor: Cesium.Color.WHITE.withAlpha(0.65),
        backgroundPadding: new Cesium.Cartesian2(5, 3),
        scaleByDistance: new Cesium.NearFarScalar(500, 1.0, 30000, 0.5),
        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 1000000),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    });
  }
}

export const TCesiem = new tCesiem();
