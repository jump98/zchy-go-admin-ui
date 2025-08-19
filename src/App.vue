<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App"
};
</script>

<style>
/* ------------------------------ */
/* 全局统一弹窗样式 */
/* ------------------------------ */

/* 弹窗标题栏背景色和文字颜色 */
.el-dialog__header {
  background-color: #304156; /* 深色背景 */
  color: #fff; /* 白色标题文字 */
  /* font-weight: bold; 可选：加粗 */
}

/* 弹窗标题文字 */
.el-dialog__title {
  color: #fff; /* 白色标题文字 */
}

/* 关闭按钮样式 */
.el-dialog__headerbtn .el-dialog__close {
  color: #fff; /* 默认白色 */
  font-size: 23px; /* 调整大小 */
  transition: color 0.3s;
}

/* 鼠标悬停关闭按钮 */
.el-dialog__headerbtn .el-dialog__close:hover {
  color: red; /* 悬停红色 */
}

/* 弹窗内容字体与行高（可选） */
.el-dialog__body {
  font-size: 16px;
  line-height: 1.6;
}

/* 弹窗底部按钮（可选） */
.el-dialog__footer {
  padding: 10px 20px;
}
</style>
