<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <el-row :gutter="20">
          <!--机构数据-->
          <el-col :span="4" :xs="24">
            <div class="head-container">
              <el-input v-model="deptName" placeholder="请输入机构名称" clearable size="small" prefix-icon="el-icon-search" style="margin-bottom: 20px" />
            </div>
            <div class="head-container">
              <el-tree ref="tree" :data="deptOptions" :props="defaultProps" :expand-on-click-node="false" :filter-node-method="filterNode" default-expand-all @node-click="handleNodeClick" />
            </div>
          </el-col>
          <!--用户数据-->
          <el-col :span="20" :xs="24">
            <el-form ref="queryForm" :model="queryParams" :inline="true" label-width="68px">
              <el-form-item>
                <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
                <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-form>

            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <el-button v-permisaction="['admin:sysRadar:add']" type="primary" icon="el-icon-plus" size="mini" @click="handleAdd"> 新增 </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-permisaction="['admin:sysRadar:edit']" type="success" icon="el-icon-edit" size="mini" :disabled="single" @click="handleUpdate"> 修改 </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-permisaction="['admin:sysRadar:remove']" type="danger" icon="el-icon-delete" size="mini" :disabled="multiple" @click="handleDelete"> 删除 </el-button>
              </el-col>
            </el-row>

            <el-table v-loading="loading" :data="sysRadarList" highlight-current-row :row-style="handleRowStyle" @selection-change="handleSelectionChange" @current-change="handleCurrentChange">
              <!--el-table-column type="selection" width="55" align="center"/-->
              <el-table-column label="编号" width="75" prop="radarId" sortable="custom" />
              <el-table-column label="机构" prop="dept.deptName" :show-overflow-tooltip="true" />
              <el-table-column label="名称" width="105" prop="radarName" sortable="custom" :show-overflow-tooltip="true" />
              <el-table-column label="编号" prop="radarKey" :show-overflow-tooltip="true" />
              <el-table-column label="特殊编号" prop="specialKey" width="108" />
              <el-table-column label="状态" width="80" sortable="custom">
                <template slot-scope="scope">
                  <el-switch v-model="scope.row.status" active-value="2" inactive-value="1" :disabled="!checkThisPermission(['admin:sysRadar:edit'])" @change="handleStatusChange(scope.row)" />
                </template>
              </el-table-column>
              <el-table-column label="创建时间" prop="createdAt" sortable="custom" width="155">
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createdAt) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
                <template slot-scope="scope">
                  <el-button slot="reference" v-permisaction="['admin:sysRadar:edit']" size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"> 修改 </el-button>
                  <el-button slot="reference" v-permisaction="['admin:sysRadar:remove']" size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"> 删除 </el-button>
                  <el-button v-if="scope.row.fromProject === 1" slot="reference" v-permisaction="['admin:sysRadar:edit']" size="mini" type="text" icon="el-icon-question" @click="handleConfirmProject(scope.row)"> 确认 </el-button>
                </template>
              </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageIndex" :limit.sync="queryParams.pageSize" @pagination="getList" />
            <!-- 添加或修改对话框 -->
            <el-dialog :title="title" :visible.sync="open" width="600px" :close-on-click-modal="false">
              <el-form ref="form" :model="form" :rules="rules" label-width="80px">
                <el-form-item label="雷达名称" prop="radarName">
                  <el-input v-model="form.radarName" placeholder="雷达名称" />
                </el-form-item>
                <el-form-item label="雷达编号" prop="radarKey">
                  <el-input v-model="form.radarKey" placeholder="雷达编号" />
                </el-form-item>
                <el-form-item label="雷达特殊编号" prop="specialKey">
                  <el-input v-model="form.specialKey" placeholder="雷达特殊编号" />
                </el-form-item>
                <el-form-item label="归属机构" prop="deptId">
                  <treeselect v-model="form.deptId" :options="deptOptions" placeholder="请选择归属机构" />
                </el-form-item>
                <!--el-form-item label="经度" prop="lng">
                                    <el-input-number v-model.number="form.lng" placeholder="经度"
                                    :controls="false" step="0.000000001"
                                    class="lnglatnumber"/>
                                </el-form-item>
                                <el-form-item label="纬度" prop="lat">
                                    <el-input-number v-model.number="form.lat" placeholder="纬度"
                                    :controls="false" step="0.000000001"
                                    class="lnglatnumber"/>
                                </el-form-item>
                                <el-form-item label="高度" prop="alt">
                                    <el-input-number v-model.number="form.alt" placeholder="高度"
                                    :controls="false"
                                    class="lnglatnumber"/>
                                </el-form-item-->
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="经度" prop="lng">
                      <el-input v-model="form.lng" placeholder="经度" class="lnglatnumber" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="纬度" prop="lat">
                      <el-input v-model="form.lat" placeholder="纬度" class="lnglatnumber" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="12">
                    <el-form-item label="高度" prop="alt">
                      <el-input v-model="form.alt" placeholder="高度" class="lnglatnumber" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="状态" prop="status">
                      <el-input v-model="form.status" placeholder="状态" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="form.remark" placeholder="备注" />
                </el-form-item>
              </el-form>
              <div slot="footer" class="dialog-footer">
                <el-button type="primary" @click="submitForm">确 定</el-button>
                <el-button @click="cancel">取 消</el-button>
              </div>
            </el-dialog>
          </el-col>
        </el-row>
        <el-row style="margin-top: 20px">
          <el-col>
            <div v-show="curradarid !== undefined" class="radar-components-row">
              <div class="radar-component">
                <h3>当前所选雷达的设备及状态信息如下：</h3>
              </div>
            </div>
            <div class="radar-components-row">
              <div class="radar-component">
                <RadarStateInfo v-show="curradarid !== undefined" :radarid="curradarid" />
              </div>
              <div class="radar-component">
                <RadarDeviceInfo v-show="curradarid !== undefined" :radarid="curradarid" />
              </div>
            </div>
            <RadarPoint v-show="curradarid !== undefined" ref="refRadarPoint" :radarid="curradarid" />
          </el-col>
        </el-row>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { addSysRadar, delSysRadar, getSysRadar, listSysRadar, updateSysRadar } from "@/api/admin/sys-radar";

import { treeselect } from "@/api/admin/sys-dept";

import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import { formValidation } from "@/utils/validate";
import RadarPoint from "../radar-point/index.vue";
import RadarDeviceInfo from "./RadarDeviceInfo.vue";
import RadarStateInfo from "./RadarStateInfo.vue";
import { checkPermission } from "@/utils/permission";

export default {
  name: "SysRadar",
  components: { Treeselect, RadarPoint, RadarDeviceInfo, RadarStateInfo },
  data() {
    return {
      curradarid: undefined,
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      isEdit: false,
      // 类型数据字典
      typeOptions: [],
      sysRadarList: [],

      // 机构名称
      deptName: undefined,
      // 机构树选项
      deptOptions: undefined,
      // 关系表类型

      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 5,
        radarId: undefined,
        radarName: undefined,
        radarKey: undefined,
        specialKey: undefined,
        deptId: undefined
      },
      // 表单参数
      form: {},
      defaultProps: {
        children: "children",
        label: "label"
      },
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
        ]
      }
    };
  },
  watch: {
    // 根据名称筛选机构树
    deptName(val) {
      this.$refs.tree.filter(val);
    }
  },
  created() {
    console.log("radar index.vue created");
    this.getList();
    this.getTreeselect();
    console.log("checkThisPermission", this.checkThisPermission(["admin:sysRadar:edit"]));
  },
  methods: {
    /** 查询参数列表 */
    getList() {
      this.loading = true;
      listSysRadar(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        console.log("res=", response);
        this.sysRadarList = response.data.list;
        this.total = response.data.count;
        this.loading = false;
      });
    },
    /** 查询机构下拉树结构 */
    getTreeselect() {
      treeselect().then(response => {
        this.deptOptions = response.data;
      });
    },
    // 筛选节点
    filterNode(value, data) {
      if (!value) return true;
      return data.label.indexOf(value) !== -1;
    },
    // 节点单击事件
    handleNodeClick(data) {
      this.queryParams.deptId = "/" + data.id + "/";
      this.getList();
    },
    /** 转换菜单数据结构 */
    normalizer(node) {
      if (node.children && !node.children.length) {
        delete node.children;
      }
      return {
        id: node.id,
        label: node.label,
        children: node.children
      };
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    checkThisPermission(value) {
      return checkPermission(value);
    },
    // 表单重置
    reset() {
      this.form = {
        radarId: undefined,
        radarName: undefined,
        radarKey: undefined,
        specialKey: undefined,
        deptId: undefined,
        lng: undefined,
        lat: undefined,
        alt: undefined,
        remark: undefined,
        status: undefined
      };
      this.resetForm("form");
    },
    getImgList: function () {
      this.form[this.fileIndex] = this.$refs["fileChoose"].resultList[0].fullUrl;
    },
    fileClose: function () {
      this.fileOpen = false;
    },
    // 关系
    // 文件
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageIndex = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.queryParams.deptId = "";
      this.handleQuery();
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.getTreeselect();
      this.open = true;
      this.title = "添加雷达管理";
      this.isEdit = false;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.radarId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleCurrentChange(item) {
      console.log("item= ", item);
      if (item) {
        this.curradarid = item.radarId;
        this.$refs.refRadarPoint.getList(this.curradarid);
      } else {
        this.curradarid = undefined;
      }
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const radarId = row.radarId || this.ids;
      getSysRadar(radarId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改雷达管理";
        this.isEdit = true;
      });
    },
    handleConfirmProject(row) {
      let that = this;
      this.$confirm('要确认"' + row.radarName + '"雷达吗?', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(function () {
          row.fromProject = 0;
          updateSysRadar(row).then(response => {
            if (response.code === 200) {
              that.msgSuccess(response.msg);
              that.getList();
            } else {
              that.msgError(response.msg);
            }
          });
        })
        .then(() => {
          that.msgSuccess(text + "成功");
        })
        .catch(function () {
          row.fromProject = 1;
        });
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.radarId !== undefined) {
            updateSysRadar(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
                this.open = false;
                this.getList();
              } else {
                this.msgError(response.msg);
              }
            });
          } else {
            addSysRadar(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
                this.open = false;
                this.getList();
              } else {
                this.msgError(response.msg);
              }
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      var Ids = (row.radarId && [row.radarId]) || this.ids;

      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(function () {
          return delSysRadar({ ids: Ids });
        })
        .then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg);
            this.open = false;
            this.getList();
          } else {
            this.msgError(response.msg);
          }
        })
        .catch(function () {});
    },
    handleRowStyle({ row, rowIndex }) {
      //console.log('handleRowStyle',row)
      if (row.fromProject) {
        return { backgroundColor: "#f0f9eb", color: "#67C23A" };
      }
      return {};
    },
    handleStatusChange(row) {
      const text = row.status === "2" ? "启用" : "停用";
      this.$confirm('确认要"' + text + '""' + row.radarName + '"雷达吗?', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(function () {
          return updateSysRadar(row);
        })
        .then(() => {
          this.msgSuccess(text + "成功");
        })
        .catch(function () {
          row.status = row.status === "2" ? "1" : "2";
        });
    }
  }
};
</script>
<style scoped>
.lnglatnumber {
  width: 100%;
}
::v-deep .el-input-number .el-input__inner {
  text-align: left;
}

.radar-components-row {
  display: flex;
  align-items: stretch;
}

.radar-component {
  flex: 1;
  margin: 0 10px;
}
</style>
