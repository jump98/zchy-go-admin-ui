<template>
  <el-dialog v-bind="$attrs" :title="title" width="50%" :close-on-click-modal="false" @open="onOpen" @close="onClose">
    <el-form ref="form" :model="ruleLevelRow" :rules="rules" label-width="100px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="预警类型" prop="alarmType" :disable="popAction == 2">
            <el-select v-model="alarmType" placeholder="请选择预警类型" size="small" @change="onChangeAlarmType">
              <el-option v-for="dict in alarmTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="预警条件" prop="optionMode">
            <el-select v-model="ruleLevelRow.optionMode" placeholder="请选择预警条件" size="small">
              <el-option v-for="dict in alarmOptionModeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <!-- 分割线-->
    <el-divider class="compact-divider" />
    <!-- 条件-->
    <el-form :model="ruleLevelRow" size="mini">
      <el-form-item v-for="item in ruleOption" :key="item.field" :label="item.label" class="compact-form-item">
        <el-row :gutter="10" type="flex" align="middle">
          <!-- 条件选择 -->
          <el-col :span="4" style="width: 80px">
            <el-select v-model="item.op" size="small">
              <el-option v-for="dict in alarmOpOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-col>

          <!-- 输入值 -->
          <el-col :span="4" style="width: 120px">
            <el-input v-model="item.value" :placeholder="item.hint" size="small" />
          </el-col>

          <!-- 后缀 -->
          <el-col :span="2">
            {{ item.suffix }}
          </el-col>
        </el-row>
      </el-form-item>
    </el-form>

    <!-- 条件说明 -->
    <div class="condition-note">
      <div><i class="el-icon-warning" /> 注: 可选填</div>
      <div><i class="el-icon-warning" /> 表达式："&gt;&lt;" 表示 n &lt; -x 并 n &lt;= x</div>
      <div><i class="el-icon-warning" /> 表达式："&gt;&lt;" 表示 n &lt; -x 或 n &gt; x</div>
    </div>
    <el-divider class="compact-divider" />

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="onClickSubmitFormBtn">确 定</el-button>
      <el-button @click="onClickCancelBtn">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { AlarmOpOptions } from "@/store/singleton/alarm_const";
import { Alarm, PopActionType } from "@/store/singleton/app";

export default {
  name: "AlarmRuleOptionEditPop",
  components: {},
  props: {
    popAction: {
      type: Number,
      default: PopActionType.UNDEFINED
    },
    // 监测类型
    checkType: {
      type: [Number, String],
      default: ""
    },
    // 规则
    ruleLevelRow: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      title: "",
      // 表单校验
      rules: {
        alarmType: [{ required: true, message: "预警类型不能为空", trigger: "blur" }]
      },
      /** 预警类型 */
      alarmTypeOptions: [],
      /** 条件组合方式 */
      alarmOptionModeOptions: [],
      /** 预警option */
      ruleOption: {},
      alarmType: "",
      alarmOpOptions: AlarmOpOptions
    };
  },
  methods: {
    onOpen() {
      console.log("checkType:", this.checkType);
      console.log("popAction:", this.popAction);
      this.alarmTypeOptions = Alarm.GetAlarmTypeOptions(this.checkType);
      this.alarmOptionModeOptions = Alarm.AlarmOptionModeOptions;
      console.log("alarmTypeOptions:", this.alarmTypeOptions);
      if (this.popAction === PopActionType.EDIT) {
        this.title = "编辑判据条件";
      }
      if (this.popAction === PopActionType.ADD) {
        this.title = "添加判据条件";
        this.alarmType = this.alarmTypeOptions[0]?.value;
        this.getOptionCond();
      }
    },

    onRowClick() {
      console.log("整行被点击了");
      // 在这里处理逻辑，比如弹出弹窗或者触发某个操作
    },
    onChangeAlarmType() {
      console.log("ruleOption.alarmType:", this.alarmType);
      this.getOptionCond();
    },

    // 获取optionCond配置
    getOptionCond() {
      let alarmtypeConfig = Alarm.GetAlarmTypeConfigById(this.alarmType);
      this.ruleOption = alarmtypeConfig?.cond || {};
      this.ruleOption.forEach((item, index) => {
        if (!item.op) {
          this.ruleOption[index].op = 4; // 默认>=
        }
      });
      console.log("alarmtypeConfig:", alarmtypeConfig);
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
    },
    onClickSubmitFormBtn() {
      console.log("确定按钮");
      let ruleOption = this.ruleOption;
      console.log("ruleOption:", ruleOption);
      let isEmpty = true;
      for (const item of ruleOption) {
        if (item.value) isEmpty = false;
      }
      if (isEmpty) {
        this.$message({
          message: "请至少填写一项",
          type: "error",
          duration: 2000
        });
        return;
      }
      this.ruleLevelRow.option = [{ ruleOption }];
      this.ruleLevelRow.optionDesc = Alarm.GetOptionDesc(ruleOption, this.ruleLevelRow.optionMode);
      console.log("ruleLevelRow:", this.ruleLevelRow);
      this.$emit("editOptionEvent", this.ruleLevelRow);
      this.close();
    }
  }
};
</script>

<style scoped>
.compact-form-item {
  margin-bottom: 2px; /* 调整为紧凑间距 */
}
.compact-divider {
  margin: 8px 0; /* 上下间距 4px，可根据需求调整 */
}
.condition-note {
  font-size: 12px; /* 可以根据需求调整大小 */
  margin-top: 2px; /* 与输入框间隔 */
}
</style>
