import Vue from "vue";

import Cookies from "js-cookie";

import "normalize.css/normalize.css"; // a modern alternative to CSS resets

import Element from "element-ui";
import "./styles/element-variables.scss";

import "@/styles/admin.scss";
import "@/styles/index.scss"; // global css

import "codemirror/lib/codemirror.css";
import VueCodemirror from "vue-codemirror";
Vue.use(VueCodemirror);

import App from "./App";
import permission from "./directive/permission";
import router from "./router";
import store from "./store";

import { getDicts } from "@/api/admin/dict/data";
import { getConfigKey } from "@/api/admin/sys-config";
import { getItems, setItems, setStringItems } from "@/api/table";
import { addDateRange, parseTime, resetForm, selectDictLabel, /* download,*/ selectItemsLabel } from "@/utils/costum";

import "./icons"; // icon
import "./permission"; // permission control
import "./utils/error-log"; // error log

import Viser from "viser-vue";
Vue.use(Viser);

import * as filters from "./filters"; // global filters

import Pagination from "@/components/Pagination";
import BasicLayout from "@/layout/BasicLayout";

import VueParticles from "vue-particles";
Vue.use(VueParticles);

import "@/utils/dialog";

// 全局方法挂载
Vue.prototype.getDicts = getDicts;
Vue.prototype.getItems = getItems;
Vue.prototype.setItems = setItems;
Vue.prototype.setStringItems = setStringItems;
Vue.prototype.getConfigKey = getConfigKey;
Vue.prototype.parseTime = parseTime;
Vue.prototype.resetForm = resetForm;
Vue.prototype.addDateRange = addDateRange;
Vue.prototype.selectDictLabel = selectDictLabel;
Vue.prototype.selectItemsLabel = selectItemsLabel;
// Vue.prototype.download = download

// 全局组件挂载
Vue.component("Pagination", Pagination);
Vue.component("BasicLayout", BasicLayout);

Vue.prototype.msgSuccess = function (msg) {
  this.$message({ showClose: true, message: msg, type: "success" });
};

Vue.prototype.msgError = function (msg) {
  this.$message({ showClose: true, message: msg, type: "error" });
};

Vue.prototype.msgInfo = function (msg) {
  this.$message.info(msg);
};

Vue.use(permission);

Vue.use(Element, {
  size: Cookies.get("size") || "medium" // set element-ui default size
});

import VueDND from "awe-dnd";
Vue.use(VueDND);

import "remixicon/fonts/remixicon.css";

console.info("智存合壹-雷达监控系统");

// register global utility filters
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key]);
});

Vue.config.productionTip = false;

new Vue({
  el: "#app",
  router,
  store,
  render: h => h(App)
});

//
setInterval(() => {
  const used = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
  const total = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
  const limit = (performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

  console.log(`[Memory] Used: ${used}MB / Total: ${total}MB (${((used / total) * 100).toFixed(1)}%)， 堆大小: ${limit}MB`);
  if (used / total > 0.95) {
    console.error("⚠️ 内存使用率超过95%，建议检查");
  }
}, 30000);
