<template>
  <el-dialog v-bind="$attrs" :title="title" width="700px" :close-on-click-modal="false" @open="onOpen" @close="onClose">
    <el-form ref="form" :model="radarPointRow" :rules="rules" label-width="100px">
      <el-row>
        <el-col :span="12">
          <el-form-item label="雷达" prop="radarId">
            <el-select v-model="radarId" placeholder="请选择" disabled>
              <el-option v-for="dict in radarIdOptions" :key="dict.key" :label="dict.value" :value="dict.key" />
            </el-select>
          </el-form-item>
        </el-col>

        <el-col :span="12">
          <el-form-item label="监测点位" prop="pointIndex">
            <el-input-number v-model.number="radarPointRow.pointIndex" disabled :controls="false" class="lnglatnumber" />
          </el-form-item>
        </el-col>

        <!-- <el-col :span="12">
          <el-form-item label="监测点类型" prop="pointType">
            <el-select v-model="radarPointRow.pointType" placeholder="请选择">
              <el-option v-for="dict in pointTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
        </el-col> -->
      </el-row>
      <el-form-item label="监测点名称" prop="pointName">
        <el-input v-model="radarPointRow.pointName" placeholder="监测点名称" />
      </el-form-item>
      <el-form-item label="监测点编号" prop="pointKey">
        <el-input v-model="radarPointRow.pointKey" placeholder="监测点编号" />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="经度°" prop="lng">
            <el-input v-model="radarPointRow.lng" placeholder="经度°" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="纬度°" prop="lat">
            <el-input v-model="radarPointRow.lat" placeholder="纬度°" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="高程m" prop="alt">
            <el-input v-model="radarPointRow.alt" placeholder="高程m" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="距离m" prop="distance">
            <el-input v-model="radarPointRow.distance" placeholder="距离m" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="radarPointRow.remark" placeholder="备注" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="onClickSubmitFormBtn">确 定</el-button>
      <el-button @click="onClickCancelBtn">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { addRadarPoint, updateRadarPoint } from "@/api/radar/radar-point";
import { formValidation } from "@/utils/validate";

export default {
  name: "RadarEditDialog",
  components: {},
  props: {
    radarPointRow: {
      type: Object,
      default: () => ({})
    },
    deptOptions: {
      type: Array,
      default: () => []
    },
    dialogAction: {
      type: Number,
      default: 0 // 动作：1修改 2增加
    },
    radarId: {
      type: Number,
      default: 0
    },
    // 关系表数据
    radarIdOptions: {
      type: Array,
      default: () => []
    },
    // 监测点类型
    pointTypeOptions: {
      type: Array,
      default: () => []
    },
    // 激活状态
    aStatusOptions: {
      type: Array,
      default: () => []
    },
    // 消警状态
    xStatusOptions: {
      type: Array,
      default: () => []
    },
    // 门限状态
    mTypeIdOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      title: "",
      // 表单校验
      // 表单校验
      rules: {
        id: [{ required: true, message: "PointID不能为空", trigger: "blur" }],
        pointName: [{ required: true, message: "监测点名称不能为空", trigger: "blur" }],
        pointKey: [{ required: true, message: "监测点编号不能为空", trigger: "blur" }],
        aStatus: [{ required: true, message: "激活状态不能为空", trigger: "blur" }],
        lng: [
          {
            required: true,
            // 此处的'formValidation'不可随着:model改变而改变，因为formValidations.js已经定义好的，全局使用
            validator: formValidation.validatorLongitude,
            message: "经度范围：-180~180（保留小数点后七位）",
            trigger: "change"
          }
        ],
        lat: [
          {
            required: true,
            validator: formValidation.validatorLatitude,
            message: "纬度范围：-90~90（保留小数点后七位）",
            trigger: "change"
          }
        ]
      },
      selectDept: {}
    };
  },
  methods: {
    onOpen() {
      if (this.dialogAction == 1) {
        this.title = "修改监测点管理";
      }
      if (this.dialogAction == 2) {
        this.resetForm("form");
        this.title = "添加新的监测点";
      }
      console.log("radarId:", this.radarId);
      console.log("radarPointRow:", this.radarPointRow);
    },

    // 提交按钮
    async onClickSubmitFormBtn() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.dialogAction == 1) {
            updateRadarPoint(this.radarPointRow).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
              } else {
                this.msgError(response.msg);
              }
            });
          }
          // 新增
          if (this.dialogAction == 2) {
            this.radarPointRow.radarId = this.radarId;
            addRadarPoint(this.radarPointRow).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
                this.radarPointRow.id = response.data;
                console.log("radarPointRow:", this.radarPointRow);
                this.$emit("addRadarPointSuccesEvent", this.radarPointRow);
                // this.getList();
              } else {
                this.msgError(response.msg);
              }
            });
          }
          this.close();
        }
      });
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
    // onSelect(node) {
    //   this.selectDept.deptName = node.label;
    //   this.selectDept.deptId = node.id;
    // }
  }
};
</script>

<style></style>
