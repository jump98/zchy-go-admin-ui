<template>
  <el-dialog v-bind="$attrs" :title="title" width="50%" :close-on-click-modal="false" @open="onOpen" @close="onClose">
    <el-form ref="form" :model="alarmRuleRow" :rules="rules" label-width="100px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="监测类型" prop="alarmTypeCheck">
            <el-select v-model="alarmRuleRow.alarmTypeCheck" placeholder="请选择监测类型" size="small">
              <el-option v-for="dict in alarmCheckTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="判据名称" prop="alarmName">
            <el-input v-model="alarmRuleRow.alarmName" placeholder="请输入判据名称" clearable size="small" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="判据简介" prop="remark">
        <el-input v-model="alarmRuleRow.remark" placeholder="请输入判据简介" clearable size="small" />
      </el-form-item>

      <el-form-item label="预警等级" prop="alarmLevel">
        <!-- 预警级别 -->
        <el-descriptions v-for="item in alarmRuleRow.levels" :key="item.alarmLevel" :column="1" size="mini" class="alarm-block" border>
          <el-descriptions-item :label="item.labelName" :label-class-name="item.labelClass" content-class-name="gary-content" :content-style="{ 'text-align': 'right' }">
            <el-button type="text" size="small" class="custom-height-btn">清空</el-button>
          </el-descriptions-item>

          <!-- <el-descriptions-item label="当前状态" :content-style="{ 'text-align': 'right' }">
            <el-button type="text" size="small" class="custom-height-btn">编辑</el-button>
            <el-button type="text" size="small" class="custom-height-btn">清空</el-button>
          </el-descriptions-item> -->

          <el-descriptions-item label="当前状态" :content-style="{ 'text-align': 'right' }">
            <el-button v-for="(item, index) in option" :key="index" type="text" size="small" class="custom-height-btn" @click="onEditOption(item, index)"> 编辑 {{ index + 1 }} </el-button>
            <el-button v-for="(item, index) in option" :key="'clear-' + index" type="text" size="small" class="custom-height-btn" @click="onClearOption(item, index)"> 清空 {{ index + 1 }} </el-button>
          </el-descriptions-item>

          <el-descriptions-item label="判据条件">
            <div class="button-wrapper" @click="onAddOptionClick(item)">
              <el-button type="text" size="small" icon="el-icon-circle-plus-outline">添加</el-button>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="处理建议">
            <el-input v-model="item.suggestion" type="textarea" autosize placeholder="请输入处理建议" maxlength="50" show-word-limit />
          </el-descriptions-item>
        </el-descriptions>
      </el-form-item>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="onClickSubmitFormBtn">确 定</el-button>
      <el-button @click="onClickCancelBtn">取 消</el-button>
    </div>

    <div>
      <!-- 编辑条件弹窗-->
      <AlarmRuleOptionEditPop
        :visible.sync="openAlarmRuleOptionEditPop"
        :pop-action="optionPopAction"
        :rule-level-row="ruleLevelRow"
        :check-type="alarmRuleRow.alarmTypeCheck"
        append-to-body
        @editOptionEvent="onEditOptionEvent"
      />
    </div>
  </el-dialog>
</template>

<script>
import { Alarm, PopActionType } from "@/store/singleton/app";
import AlarmRuleOptionEditPop from "./_AlarmRuleOptionEditPop.vue";

export default {
  name: "AlarmRuleEditPop",
  components: { AlarmRuleOptionEditPop },
  props: {
    popAction: {
      type: Number,
      default: PopActionType.UNDEFINED
    },
    // 预警规则
    alarmRuleRow: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      title: "",
      // 表单校验
      rules: {
        id: [{ required: true, message: "PointID不能为空", trigger: "blur" }]
      },
      /** 监测类型 */
      alarmCheckTypeOptions: Alarm.AlarmCheckTypeOptions,
      /** 输入的监测类型 */
      inputCheckType: "",
      inputBuleRemark: "",
      openAlarmRuleOptionEditPop: false,
      /** 弹窗类型 */
      optionPopAction: PopActionType.UNDEFINED,
      /** 选择的条件option */
      ruleOptionRow: {},
      /** 选中的规则等级行 */
      ruleLevelRow: {}
    };
  },
  methods: {
    onOpen() {
      console.log("alarmRuleRow:", this.alarmRuleRow);
      if (this.popAction === PopActionType.EDIT) {
        this.title = "编辑判据";
      }
      if (this.popAction === PopActionType.ADD) {
        this.resetForm("form");
        this.title = "添加判据";
        this.alarmRuleRow.alarmTypeCheck = Alarm.AlarmCheckTypeOptions[0].value;
      }
    },
    // 点击添加条件按钮
    onAddOptionClick(row) {
      console.log("点击添加条件按钮:", row);
      console.log("监测类型:", this.alarmRuleRow.alarmTypeCheck);
      if (!this.alarmRuleRow.alarmTypeCheck) {
        this.$message({
          message: "请选择监测类型",
          type: "warning",
          duration: 2000
        });
        return;
      }

      this.ruleLevelRow = row;
      this.optionPopAction = PopActionType.ADD;
      this.openAlarmRuleOptionEditPop = true;
    },

    // 编辑完成事件
    onEditOptionEvent(row) {
      console.log("编辑Option结果：", row);
    },

    // 提交按钮
    async onClickSubmitFormBtn() {
      // this.$refs["form"].validate(valid => {
      //   if (valid) {
      //     if (this.dialogAction == 1) {
      //       updateRadarPoint(this.radarPointRow).then(response => {
      //         if (response.code === 200) {
      //           this.msgSuccess(response.msg);
      //         } else {
      //           this.msgError(response.msg);
      //         }
      //       });
      //     }
      //     // 新增
      //     if (this.dialogAction == 2) {
      //       this.radarPointRow.radarId = this.radarId;
      //       addRadarPoint(this.radarPointRow).then(response => {
      //         if (response.code === 200) {
      //           this.msgSuccess(response.msg);
      //           this.radarPointRow.id = response.data;
      //           console.log("radarPointRow:", this.radarPointRow);
      //           this.$emit("addRadarPointSuccesEvent", this.radarPointRow);
      //           // this.getList();
      //         } else {
      //           this.msgError(response.msg);
      //         }
      //       });
      //     }
      //     this.close();
      // }
      // });
    },
    // 取消按钮
    onClickCancelBtn() {
      this.close();
    },
    onClose() {
      this.close();
    },
    close() {
      this.$emit("update:visible", false);
    }
  }
};
</script>
<style>
.alarm-block {
  margin-top: 8px; /* 两个描述块之间的间距，可调整 */
}
.blue_label {
  background-color: #06bdf2 !important; /* 加 !important 避免被 Element Plus 默认样式覆盖 */
  color: #fff !important;
  width: 100px !important; /* 表头宽度，可以调短 */
}
.yellow_label {
  background-color: #e8db09 !important; /* 加 !important 避免被 Element Plus 默认样式覆盖 */
  color: #fff !important;
  width: 100px !important; /* 表头宽度，可以调短 */
}
.orange_label {
  background-color: #fbac01 !important; /* 加 !important 避免被 Element Plus 默认样式覆盖 */
  color: #fff !important;
  width: 100px !important; /* 表头宽度，可以调短 */
}
.red_label {
  background-color: #ff0303 !important; /* 加 !important 避免被 Element Plus 默认样式覆盖 */
  color: #fff !important;
  width: 100px !important; /* 表头宽度，可以调短 */
}

.custom-height-btn {
  height: 16px !important; /* 自定义高度 */
  line-height: 16px !important; /* 文字垂直居中 */
  padding: 0 8px !important; /* 调整左右内边距 */
  font-size: 12px; /* 可选：更小字体 */
}

.gary-content {
  background-color: #e6e6e6 !important;
}
.button-row {
  padding: 0 !important; /* 去掉默认 padding，确保占满整行 */
}

.button-wrapper {
  height: 18px !important; /* 自定义高度 */
  line-height: 18px !important; /* 文字垂直居中 */
  width: 100%; /* 占满整行 */
  display: flex; /* flex 布局 */
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  cursor: pointer; /* 鼠标手型 */
  background-color: transparent; /* 背景透明 */
}

.button-wrapper:hover {
  background-color: #f5f5f5; /* 可选：悬停效果，让整行有反馈 */
}
</style>
