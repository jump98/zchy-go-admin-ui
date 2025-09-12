<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <!-- 搜索栏-->
        <el-form :inline="true">
          <el-form-item label="机构名称">
            <el-select v-model="inputDeptId" placeholder="请选择机构" clearable size="small">
              <el-option v-for="dict in deptOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="监测类型">
            <el-select v-model="inputAlarmCheckType" placeholder="请选择监测类型" clearable size="small">
              <el-option v-for="dict in alarmCheckTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="判据名称">
            <el-input v-model="queryParams.deptName" placeholder="请输入判据名称" clearable size="small" @keyup.enter.native="onHandleQuery" />
          </el-form-item>

          <el-form-item>
            <el-button class="filter-item" type="success" icon="el-icon-search" size="mini" @click="onHandleQuery">搜索</el-button>
            <el-button v-permisaction="['admin:sysDept:add']" class="filter-item" type="primary" icon="el-icon-plus" size="mini" @click="onClickAddBtn">新增判据</el-button>
          </el-form-item>
        </el-form>

        <!-- 表单信息-->
        <el-table v-loading="loading" :data="alarmRuleList" row-key="id" default-expand-all border :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" :row-style="handleRowStyle">
          <el-table-column prop="alarmCheckTypeValue" label="预警类型" />
          <el-table-column prop="alarmName" label="判据名称" width="200" />
          <el-table-column prop="remark" label="判据简介" width="200" />
          <el-table-column label="创建时间" align="center" prop="createdAt" width="200">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createdAt) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button v-permisaction="['admin:sysDept:edit']" size="mini" type="text" icon="el-icon-edit" @click="onClickUpdateBtn(scope.row)">修改</el-button>
              <el-button v-permisaction="['admin:sysDept:remove']" size="mini" type="text" icon="el-icon-delete" @click="onClickDeleteBtn(scope.row)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 编辑弹窗-->
        <AlarmRuleEditPop :visible.sync="openAlarmRuleEditPop" :pop-action="popAction" :alarm-rule-row="alarmRuleRow" />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { Alarm, Dept, PopActionType } from "@/store/singleton/app";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import AlarmRuleEditPop from "./AlarmRuleEditPop.vue";

export default {
  name: "AlarmRule",
  components: { AlarmRuleEditPop },
  data() {
    return {
      // 遮罩层
      loading: true,
      /** 机构树选项 */
      deptOptions: [],
      /** 输入的机构Id */
      inputDeptId: "",
      /** 监测类型 */
      alarmCheckTypeOptions: Alarm.AlarmCheckTypeOptions,
      /** 输入的监测类型 */
      inputAlarmCheckType: "",
      /** 预警规则列表 */
      alarmRuleList: [],

      // action:
      // 弹出层标题
      // title: "",
      // isEdit: false,
      // 是否显示弹出层
      // open: false,
      // 查询参数
      queryParams: {
        deptName: undefined,
        status: undefined
      },
      /** 弹窗类型 */
      popAction: PopActionType.UNDEFINED,
      /** 打开编辑弹窗 */
      openAlarmRuleEditPop: false,
      // 表单参数
      alarmRuleRow: {}
      // 表单校验
      // rules: {
      //   parentId: [{ required: true, message: "上级机构不能为空", trigger: "blur" }],
      //   deptName: [{ required: true, message: "机构名称不能为空", trigger: "blur" }],
      //   sort: [{ required: true, message: "菜单顺序不能为空", trigger: "blur" }],
      //   leader: [{ required: true, message: "负责人不能为空", trigger: "blur" }],
      //   email: [
      //     {
      //       type: "email",
      //       message: "'请输入正确的邮箱地址",
      //       trigger: ["blur", "change"]
      //     }
      //   ],
      //   phone: [
      //     {
      //       pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
      //       message: "请输入正确的手机号码",
      //       trigger: "blur"
      //     }
      //   ]
      // }
    };
  },
  created() {
    console.log("AlarmRule.created");
    this.init();
  },
  methods: {
    async init() {
      this.loading = true;
      await this.getDetpList();
      await this.getAlarmRules();
      this.loading = false;
    },

    /** 查询机构列表 */
    async getDetpList() {
      this.deptOptions = [];
      this.deptOptions = await Dept.GetDeptListFormatSelect(this.queryParams);
      this.inputDeptId = this.deptOptions[0]?.value || "";
    },

    /** 查询预警规则列表 */
    async getAlarmRules() {
      let deptId = this.inputDeptId;
      if (!deptId) {
        this.$message({
          message: "请选择机构",
          type: "warning",
          duration: 2000
        });
        return;
      }

      this.alarmRuleList = [];
      this.alarmRuleList = await Alarm.GetAlarmRules({ deptId });
      console.log("this.alarmRuleList:", this.alarmRuleList);
    },

    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    // reset() {
    //   this.form = {
    //     deptId: undefined,
    //     parentId: undefined,
    //     deptName: undefined,
    //     sort: 10,
    //     leader: undefined,
    //     phone: undefined,
    //     email: undefined,
    //     status: "2"
    //   };
    // },
    /** 搜索按钮操作 */
    onHandleQuery() {
      console.log("搜索");
      this.getAlarmRules();
    },

    /** 新增按钮操作 */
    onClickAddBtn() {
      let deptId = this.inputDeptId;
      this.alarmRuleRow = Alarm.CreateEmptyAlarmRule(deptId);
      this.popAction = PopActionType.ADD;
      this.openAlarmRuleEditPop = true;
    },
    /** 修改按钮操作 */
    onClickUpdateBtn(row) {
      console.log("修改按钮操作:", row);
      this.alarmRuleRow = row;
      this.popAction = PopActionType.EDIT;
      this.openAlarmRuleEditPop = true;
    },
    /** 提交按钮 */
    // submitForm: function () {
    //   this.$refs["form"].validate(valid => {
    //     if (valid) {
    //       this.form.status = parseInt(this.form.status);
    //       this.form.sort = parseInt(this.form.sort);
    //       if (this.form.deptId !== undefined) {
    //         updateDept(this.form, this.form.deptId).then(response => {
    //           if (response.code === 200) {
    //             this.msgSuccess(response.msg);
    //             this.open = false;
    //             this.getList();
    //           } else {
    //             this.msgError(response.msg);
    //           }
    //         });
    //       } else {
    //         addDept(this.form).then(response => {
    //           if (response.code === 200) {
    //             this.msgSuccess(response.msg);
    //             this.open = false;
    //             this.getList();
    //           } else {
    //             this.msgError(response.msg);
    //           }
    //         });
    //       }
    //     }
    //   });
    // },
    /** 删除按钮操作 */
    // onClickDeleteBtn(row) {
    //   const Ids = (row.deptId && [row.deptId]) || this.ids;
    //   this.$confirm('是否确认删除名称为"' + row.deptName + '"的数据项?', "警告", {
    //     confirmButtonText: "确定",
    //     cancelButtonText: "取消",
    //     type: "warning"
    //   })
    //     .then(function () {
    //       return delDept({ ids: Ids });
    //     })
    //     .then(response => {
    //       if (response.code === 200) {
    //         this.msgSuccess(response.msg);
    //         this.open = false;
    //         this.getList();
    //       } else {
    //         this.msgError(response.msg);
    //       }
    //     })
    //     .catch(function () {});
    // },
    handleRowStyle({ row }) {
      // console.log("handleRowStyle", row);
      if (row.fromProject) {
        return { backgroundColor: "#f0f9eb", color: "#67C23A" };
      }
      return {};
    }
  }
};
</script>
