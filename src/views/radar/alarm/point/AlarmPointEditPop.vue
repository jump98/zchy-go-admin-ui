<template>
  <el-dialog v-bind="$attrs" :title="title" width="50%" :close-on-click-modal="false" @open="onOpen" @close="onClose">
    <el-form size="small" label-width="100px">
      <div v-if="radarPointId != 0" style="margin-bottom: 20px">
        <el-radio-group v-model="localMTypeId" @change="onRadioInputEvent">
          <el-radio :label="0" style="font-size: 28px; font-weight: bold">使用全局报警门限</el-radio>
          <el-radio :label="1" style="font-size: 28px; font-weight: bold">使用独立报警门限</el-radio>
        </el-radio-group>
      </div>

      <!-- 预警级别 -->
      <el-row v-for="item in alarmRuleList" :key="item.alarmType">
        <el-divider class="compact-divider" />
        <el-descriptions :title="item.alarmTypeName" :formatter="alarmTypeFormat" :column="1" size="mini" class="alarm-block" border />
        <el-form ref="formRef" :model="item" size="small" label-width="100px" :rules="rules">
          <el-col :span="4">
            <el-form-item prop="blueOption" label-width="70px">
              <template #label>
                <span class="label-color blue">蓝级：</span>
              </template>
              <el-input v-model="item.blueOption" :disabled="localMTypeId == 0 && radarPointId != 0" placeholder="预警值" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item prop="yellowOption" label-width="70px">
              <template #label>
                <span class="label-color yellow">黄级：</span>
              </template>
              <el-input v-model="item.yellowOption" :disabled="localMTypeId == 0 && radarPointId != 0" placeholder="预警值" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item prop="orangeOption" label-width="70px">
              <template #label>
                <span class="label-color orange">橙级：</span>
              </template>
              <el-input v-model="item.orangeOption" :disabled="localMTypeId == 0 && radarPointId != 0" placeholder="预警值" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item prop="redOption" label-width="70px">
              <template #label>
                <span class="label-color red">红级：</span>
              </template>
              <el-input v-model="item.redOption" :disabled="localMTypeId == 0 && radarPointId != 0" placeholder="预警值" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-form>
      </el-row>
      <el-divider class="compact-divider" />
    </el-form>

    <el-form v-if="alarmRuleList && alarmRuleList.length > 0" ref="formRef2" :model="alarmRuleList[0]" size="small" label-width="100px" :rules="rules2">
      <el-row style="margin-top: 10px">
        <el-col :span="12">
          <el-form-item label-width="150px" label="持续报警时间跨度：" prop="interval">
            <el-input v-model="alarmRuleList[0].interval" :disabled="localMTypeId == 0 && radarPointId != 0" placeholder="必填" :style="{ width: '100%' }">
              <template slot="append">单位：分钟，≥10</template>
            </el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="onClickSubmitFormBtn">确 定</el-button>
      <el-button @click="onClickCancelBtn">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { Alarm } from "@/store/singleton/app";

export default {
  name: "AlarmPointEditPop",
  components: {},
  props: {
    deptId: {
      type: Number,
      default: 0
    },
    radarPointId: {
      type: Number,
      default: 0
    },
    mTypeId: {
      type: Number,
      default: 0
    },
    radarPointName: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      title: "",
      // 表单校验
      rules: {
        blueOption: [{ required: true, message: "蓝级预警值不能为空", trigger: "blur" }],
        yellowOption: [{ required: true, message: "黄级预警值不能为空", trigger: "blur" }],
        orangeOption: [{ required: true, message: "橙级预警值不能为空", trigger: "blur" }],
        redOption: [{ required: true, message: "红级预警值不能为空", trigger: "blur" }]
      },
      // 表单校验
      rules2: {
        interval: [
          { required: true, message: "持续报警时间跨度不能为空", trigger: "blur" },
          {
            validator: (rule, value, callback) => {
              if (!value) {
                callback(new Error("不能为空"));
              } else if (isNaN(value) || Number(value) < 10) {
                callback(new Error("必须是数字且≥10"));
              } else {
                callback();
              }
            },
            trigger: "blur"
          }
        ]
      },
      /** 监测类型 */
      alarmCheckTypeOptions: Alarm.AlarmCheckTypeOptions,
      /** 输入的监测类型 */
      inputCheckType: "",
      inputBuleRemark: "",
      openAlarmRuleOptionEditPop: false,
      /** 选择的条件option */
      ruleOptionRow: {},
      /** 选中的规则等级行 */
      ruleLevelRow: {},
      alarmRuleList: [],
      localMTypeId: 0 // 0全局 1=独立门限
    };
  },
  methods: {
    async onOpen() {
      console.log("radarPointId:", this.radarPointId);
      if (this.radarPointId == 0) {
        this.title = "编辑全局报警门限";
      } else {
        this.title = `编辑【${2}】独立报警门限`;
      }
      this.localMTypeId = Number(this.mTypeId);
      console.log(" this.localMTypeId:", this.localMTypeId);
      this.getAlarmRules();
    },

    /** 查询预警规则列表 */
    async getAlarmRules() {
      let deptId = this.deptId;
      let radarPointId = this.radarPointId;
      if (!deptId) {
        this.$message({
          message: "请选择机构",
          type: "warning",
          duration: 2000
        });
        return;
      }
      if (this.localMTypeId == 0) {
        radarPointId = 0; // 查询全局门限
      }

      this.alarmRuleList = [];
      this.alarmRuleList = await Alarm.GetAlarmRules({ deptId, radarPointId });
      for (let i = 0; i < this.alarmRuleList.length; i++) {
        this.alarmRuleList[i].alarmTypeName = this.alarmTypeFormat(this.alarmRuleList[i].alarmType);
      }
      console.log("this.alarmRuleList:", this.alarmRuleList);
    },

    alarmTypeFormat(alarmType) {
      console.log("alarmType:", alarmType);
      switch (alarmType) {
        case 100:
          return "形变门限 (mm)";
        case 101:
          return "形变速度门限 (mm/h)";
        case 102:
          return "形变加速度门限 (mm/h²)";
      }
    },
    onRadioInputEvent() {
      console.log("this.:", this.localMTypeId);
      this.getAlarmRules();
    },

    // 提交按钮
    async onClickSubmitFormBtn() {
      const validResults = await Promise.all(
        this.$refs.formRef.map(form => {
          return new Promise(resolve => form.validate(valid => resolve(valid)));
        })
      );

      if (validResults.includes(false)) return; // 有一条没通过就返回
      const valid2 = await new Promise(resolve => {
        this.$refs.formRef2.validate((valid, fields) => {
          if (!valid) {
            console.log("验证失败:", fields);
          }
          resolve(valid);
        });
      });
      if (!valid2) return; // 验证失败直接返回

      console.log("alarmRuleList:", this.alarmRuleList);
      let items = [];
      for (const item of this.alarmRuleList) {
        items.push({
          alarmName: String(item.alarmName),
          alarmType: item.alarmType,
          blueOption: item.blueOption,
          orangeOption: item.orangeOption,
          yellowOption: item.yellowOption,
          redOption: item.redOption,
          duration: Number(item.duration),
          interval: Number(item.interval)
        });
      }

      let param = {
        mode: this.localMTypeId,
        radarPointId: this.radarPointId,
        deptId: this.deptId,
        items: items
      };
      let resp = await Alarm.UpdateAlarmRules(param);
      if (!resp.success) return;
      this.$message({
        message: "设置成功",
        type: "success",
        duration: 2000
      });
      this.$emit("updateAlarmEvent", { radarPointId: this.radarPointId, mTypeId: this.localMTypeId });
      this.onClose();
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
/* 不同颜级对应背景 */
.label-color.blue {
  color: #06bdf2 !important;
}
.label-color.yellow {
  color: #e8db09 !important;
}
.label-color.orange {
  color: #fbac01 !important;
}
.label-color.red {
  color: #ff0303 !important;
}
.compact-divider {
  margin-top: 2px;
  margin-bottom: 2px;
}
.alarm-rule-edit-pop .compact-divider {
  margin-top: 2px;
  margin-bottom: 2px;
}

.alarm-rule-edit-pop .el-descriptions {
  margin-bottom: 2px;
}

/* .el-form-item__label{

} */

.alarm-rule-edit-pop .el-form {
  margin-top: 2px;
}

/* descriptions 紧接 form 时的精确控制 */
.el-descriptions__header {
  margin-bottom: 0 !important;
}

/* 只改标题（可选） */
.el-descriptions__title {
  margin-bottom: 2 !important;
}
</style>
