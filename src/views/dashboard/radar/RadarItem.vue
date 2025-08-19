<template>
  <div>
    <el-dialog v-bind="$attrs" title="编辑框" width="40%" custom-class="my-radar-dialog" @open="onOpen" @close="onClose">
      <el-descriptions title="垂直带边框列表" direction="vertical" :column="4" border>
        <el-descriptions-item label="用户名">kooriookami</el-descriptions-item>
        <el-descriptions-item label="手机号">18100000000</el-descriptions-item>
        <el-descriptions-item label="居住地" :span="2">苏州市</el-descriptions-item>
        <el-descriptions-item label="备注">
          <el-tag size="small">学校</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="联系地址">江苏省苏州市吴中区吴中大道 1188 号</el-descriptions-item>
      </el-descriptions>

      <!-- <el-row :gutter="5">
        <el-form ref="formRef" :model="formData" :rules="rules" size="mini" label-width="100px" label-position="left">
          <el-col :span="12">
            <el-form-item label="单行文本" prop="field101">
              <el-input v-model="formData.field101" placeholder="请输入单行文本" clearable :style="{ width: '100%' }" />
            </el-form-item>
          </el-col>
        </el-form>
      </el-row> -->

      <!-- 弹窗底部按钮 -->
      <!-- <span slot="footer" class="dialog-footer">
        <el-button @click="close">取消</el-button>
        <el-button type="primary" @click="handelConfirm">确定</el-button>
      </span> -->
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "RadarItem",
  props: {
    radarInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      dialogVisible: this.visible,
      formData: {
        field101: ""
      },
      rules: {
        field101: [{ required: true, message: "请输入单行文本", trigger: "blur" }]
      }
    };
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
    },
    dialogVisible(val) {
      this.$emit("update:visible", val);
    }
  },
  methods: {
    onOpen() {
      console.log("RadarItem onOpen", this.radarInfo);
    },
    onClose() {
      console.log("关闭onClose");
      this.close();
    },
    close() {
      console.log("关闭close");
      this.$emit("update:visible", false);
    },
    handelConfirm() {
      console.log("关闭console");
      this.close();
    }
  }
};
</script>
