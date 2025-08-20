<template>
  <el-dialog v-bind="$attrs" :title="title" width="600px" :close-on-click-modal="false" @open="onOpen" @close="onClose">
    <el-form ref="form" :model="radarInfo" :rules="rules" label-width="80px">
      <el-form-item label="雷达名称" prop="radarName">
        <el-input v-model="radarInfo.radarName" placeholder="雷达名称" />
      </el-form-item>
      <el-form-item label="雷达编号" prop="radarKey">
        <el-input v-model="radarInfo.radarKey" placeholder="雷达编号" />
      </el-form-item>
      <el-form-item label="雷达特殊编号" prop="specialKey">
        <el-input v-model="radarInfo.specialKey" placeholder="雷达特殊编号" />
      </el-form-item>
      <el-form-item label="归属机构" prop="deptId">
        <treeselect v-model="radarInfo.deptId" :options="deptOptions" placeholder="请选择归属机构" @select="onSelect" />
      </el-form-item>
      <el-row>
        <el-col :span="12">
          <el-form-item label="经度" prop="lng">
            <el-input v-model="radarInfo.lng" placeholder="经度" class="lnglatnumber" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="纬度" prop="lat">
            <el-input v-model="radarInfo.lat" placeholder="纬度" class="lnglatnumber" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="高度" prop="alt">
            <el-input v-model="radarInfo.alt" placeholder="高度" class="lnglatnumber" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-input v-model="radarInfo.status" placeholder="状态" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="radarInfo.remark" placeholder="备注" />
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button type="primary" @click="onClickSubmitFormBtn">确 定</el-button>
      <el-button @click="onClickCancelBtn">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
import Treeselect from "@riophae/vue-treeselect";
import { formValidation } from "@/utils/validate";
import { addSysRadar, updateSysRadar } from "@/api/admin/sys-radar";

export default {
  name: "RadarEditDialog",
  components: { Treeselect },
  props: {
    radarInfo: {
      type: Object,
      default: () => ({})
    },
    deptOptions: {
      type: Array,
      default: () => []
    },
    action: {
      type: Number,
      default: 1 //动作：1修改 2增加
    }
  },
  data() {
    return {
      title: "",
      // 表单校验
      rules: {
        radarId: [{ required: true, message: "RadarID不能为空", trigger: "blur" }],
        radarName: [{ required: true, message: "雷达名称不能为空", trigger: "blur" }],
        radarKey: [{ required: true, message: "雷达编号不能为空", trigger: "blur" }],
        deptId: [{ required: true, message: "机构不能为空", trigger: "blur" }],
        lng: [
          {
            required: true,
            //此处的'formValidation'不可随着:model改变而改变，因为formValidations.js已经定义好的，全局使用
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
        ],
        alt: [{ required: true, message: "高度不能为空", trigger: "blur" }]
      },
      selectDept: {}
    };
  },
  methods: {
    onOpen() {
      if (this.action == 1) {
        this.title = "修改雷达管理";
      }
      if (this.action == 2) {
        this.resetForm("form");
        this.title = "添加雷达管理";
      }
      console.log("this.radarInfo:", this.radarInfo);
    },

    //提交按钮
    async onClickSubmitFormBtn() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          //修改
          if (this.action == 1) {
            updateSysRadar(this.radarInfo).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
              } else {
                this.msgError(response.msg);
              }
            });
          }
          //新增
          if (this.action == 2) {
            addSysRadar(this.radarInfo).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
                // this.radarInfo.dept = ;
                this.radarInfo.radarId = response.data;
                this.radarInfo.dept = this.selectDept;
                console.log("response.data;:", response.data);
                this.$emit("addRadar", this.radarInfo);
              } else {
                this.msgError(response.msg);
              }
            });
          }
          this.close();
        }
      });
    },
    //取消按钮
    onClickCancelBtn() {
      this.close();
    },
    onClose() {
      this.close();
    },
    close() {
      this.$emit("update:visible", false);
    },
    onSelect(node) {
      this.selectDept.deptName = node.label;
      this.selectDept.deptId = node.id;
    }
  }
};
</script>

<style></style>
