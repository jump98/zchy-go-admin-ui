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
                <el-button v-permisaction="['admin:sysRadar:add']" type="primary" icon="el-icon-plus" size="mini" @click="onClickAddRadarBtn"> 新增 </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-permisaction="['admin:sysRadar:edit']" type="success" icon="el-icon-edit" size="mini" :disabled="single" @click="onClickUpdateRadarBtn"> 修改 </el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button v-permisaction="['admin:sysRadar:remove']" type="danger" icon="el-icon-delete" size="mini" :disabled="multiple" @click="onClickDeleteRadarBtn"> 删除 </el-button>
              </el-col>
            </el-row>

            <el-table v-loading="loading" :data="sysRadarList" highlight-current-row :row-style="handleRowStyle" @selection-change="onHandleSelectionChange" @current-change="onHandleCurrentChange">
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
                  <el-button slot="reference" v-permisaction="['admin:sysRadar:edit']" size="mini" type="text" icon="el-icon-edit" @click="onClickUpdateRadarBtn(scope.row)"> 修改 </el-button>
                  <el-button slot="reference" v-permisaction="['admin:sysRadar:remove']" size="mini" type="text" icon="el-icon-delete" @click="onClickDeleteRadarBtn(scope.row)"> 删除 </el-button>
                  <el-button v-if="scope.row.fromProject === 1" slot="reference" v-permisaction="['admin:sysRadar:edit']" size="mini" type="text" icon="el-icon-question" @click="handleConfirmProject(scope.row)"> 确认 </el-button>
                </template>
              </el-table-column>
            </el-table>

            <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageIndex" :limit.sync="queryParams.pageSize" @pagination="getList" />

            <!-- 添加或修改对话框 -->
            <RadarEditDialog :visible.sync="openDialog" :radar-info="radarRow" :action="dialogAction" :dept-options="deptOptions" @addRadar="onAddRadarEvent" />
          </el-col>
        </el-row>

        <el-row style="margin-top: 20px">
          <!-- 显示点位信息  -->
          <RadarPoint v-show="curradarid != 0" ref="refRadarPoint" :radarid="curradarid" />

          <el-col>
            <div v-show="curradarid != 0" class="radar-components-row">
              <div class="radar-component">
                <h3>当前所选雷达的设备及状态信息如下：</h3>
              </div>
            </div>
            <div class="radar-components-row">
              <!-- 显示雷达设备状态  -->
              <div class="radar-component">
                <RadarStateInfo v-show="curradarid != 0" :radarid="curradarid" />
              </div>
              <!-- 显示雷达设备信息  -->
              <div class="radar-component">
                <RadarDeviceInfo v-show="curradarid != 0" :radarid="curradarid" />
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { delSysRadar, listSysRadar, updateSysRadar } from "@/api/admin/sys-radar";

import { treeselect } from "@/api/admin/sys-dept";

import "@riophae/vue-treeselect/dist/vue-treeselect.css";

import RadarPoint from "../radar-point/index.vue";
import RadarDeviceInfo from "./RadarDeviceInfo.vue";
import RadarEditDialog from "./RadarEditDialog.vue";
import RadarStateInfo from "./RadarStateInfo.vue";
import { checkPermission } from "@/utils/permission";

export default {
  name: "SysRadar",
  components: { RadarPoint, RadarDeviceInfo, RadarStateInfo, RadarEditDialog },
  data() {
    return {
      //当前的雷达ID
      curradarid: 0,
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
      //弹窗action
      dialogAction: 0, //1=修改 2=增加
      // 是否显示弹出层
      openDialog: false,
      // 类型数据字典
      typeOptions: [],
      //系统雷达列表
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
        radarId: 0,
        radarName: undefined,
        radarKey: undefined,
        specialKey: undefined,
        deptId: undefined
      },
      // 表单参数
      radarRow: {},
      defaultProps: {
        children: "children",
        label: "label"
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
    // this.checkThisPermission(["admin:sysRadar:edit"]);
  },
  methods: {
    /** 查询参数列表 */
    async getList() {
      this.loading = true;
      let response = await listSysRadar(this.addDateRange(this.queryParams, this.dateRange));
      console.log("获得雷达设备列表:", response);
      this.sysRadarList = response.data.list;
      this.total = response.data.count;
      this.loading = false;
    },
    /** 查询机构下拉树结构 */
    async getTreeselect() {
      let resp = await treeselect();
      this.deptOptions = resp.data;
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

    checkThisPermission(value) {
      return checkPermission(value);
    },

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

    //点击新增雷达
    onClickAddRadarBtn() {
      // this.reset();
      this.getTreeselect();
      this.openDialog = true;
      this.dialogAction = 2;
      this.radarRow = {
        // radarId: 0,
        // radarName: "",
        // radarKey: "",
        // specialKey: "",
        // deptId: 0,
        // lng: "",
        // lat: "",
        // alt: "",
        // remark: "",
        // status: 0
      };
    },
    /** 修改按钮操作 */
    async onClickUpdateRadarBtn(row) {
      // console.log("点击修改:", row);
      if (!row.radarId) return;
      this.radarRow = row;
      this.openDialog = true;
      this.dialogAction = 1;
    },

    //添加雷达事件
    onAddRadarEvent(row) {
      // console.log("添加雷达事件.row:", row);
      this.sysRadarList.push(row);
    },

    // 当选择项发生变化时会触发该事件
    onHandleSelectionChange(selection) {
      console.log("当选择项发生变化时会触发该事件");
      this.ids = selection.map(item => item.radarId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },

    //当表格的当前行发生变化的时候会触发该事件
    onHandleCurrentChange(currentRow) {
      console.log("当表格的当前行发生变化的时候会触发该事件");
      if (currentRow) {
        console.log("设置curradarid:", currentRow.radarId);
        this.curradarid = currentRow.radarId;
        this.$refs.refRadarPoint.getList(this.curradarid);
      } else {
        console.log("设置curradarid=0");
        this.curradarid = 0;
      }
    },

    //确定按钮
    handleConfirmProject(row) {
      let self = this;
      this.$confirm('要确认"' + row.radarName + '"雷达吗?', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(function () {
          row.fromProject = 0;
          updateSysRadar(row).then(response => {
            if (response.code === 200) {
              self.msgSuccess(response.msg);
              self.getList();
            } else {
              self.msgError(response.msg);
            }
          });
        })
        .then(() => {
          self.msgSuccess("成功");
        })
        .catch(function () {
          row.fromProject = 1;
        });
    },

    /** 删除按钮操作 */
    onClickDeleteRadarBtn(row) {
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
            this.openDialog = false;
            this.getList();
          } else {
            this.msgError(response.msg);
          }
        })
        .catch(function () {});
    },
    handleRowStyle({ row }) {
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
