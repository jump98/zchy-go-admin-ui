<template>
  <BasicLayout>
    <template #wrapper>
      <el-card class="box-card">
        <!-- 搜索栏-->
        <el-form :inline="true">
          <el-form-item label="机构名称">
            <el-select v-model="inputDeptId" placeholder="请选择机构" size="small" @change="onChangeDeptEvent">
              <el-option v-for="dict in deptOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item>
          <!-- <el-form-item label="监测类型">
            <el-select v-model="inputAlarmCheckType" placeholder="请选择监测类型" clearable size="small">
              <el-option v-for="dict in alarmCheckTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
            </el-select>
          </el-form-item> -->

          <!-- <el-form-item label="判据名称">
            <el-input v-model="queryParams.deptName" placeholder="请输入判据名称" clearable size="small" @keyup.enter.native="onHandleQuery" />
          </el-form-item> -->

          <el-form-item>
            <!-- <el-button class="filter-item" type="success" icon="el-icon-search" size="mini" @click="onHandleQuery">搜索</el-button> -->
            <el-button class="filter-item" type="primary" icon="el-icon-setting" size="mini" @click="onClickGlobalBtn">全局预警阀值</el-button>
          </el-form-item>
        </el-form>

        <!-- 表单信息-->

        <el-card class="box-card">
          <el-table v-loading="loading" :data="radarPointList">
            <el-table-column label="序号" width="50" type="index" sortable="custom" />
            <el-table-column label="测点名称" align="center" prop="pointName" :show-overflow-tooltip="true" />
            <el-table-column label="创建时间" align="center" prop="createdAtStr" :show-overflow-tooltip="true" />
            <!-- <el-table-column label="创建时间" align="center" prop="createdAt" :formatter="createdAtFormat" :show-overflow-tooltip="true" /> -->
            <!-- <el-table-column label="雷达" align="center" prop="radarId" :formatter="radarIdFormat" width="100">
            <template slot-scope="scope">
              {{ radarIdFormat(scope.row) }}
            </template>
          </el-table-column> -->
            <el-table-column label="经度°" align="center" prop="lng" :show-overflow-tooltip="true" />
            <el-table-column label="纬度°" align="center" prop="lat" :show-overflow-tooltip="true" />
            <el-table-column label="高程m" align="center" prop="alt" :show-overflow-tooltip="true" />
            <el-table-column label="距离m" align="center" prop="distance" :show-overflow-tooltip="true" />
            <!-- <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" /> -->
            <el-table-column label="激活状态" class-name="status-green" align="center" prop="aStatus" :formatter="aStatusFormat" width="100">
              <template slot-scope="{ row }">
                <span :style="{ color: row.aStatus === 0 ? 'green' : 'red' }">
                  {{ aStatusFormat(row.aStatus) }}
                </span>
              </template>
            </el-table-column>

            <el-table-column label="消警状态" align="center" prop="xStatus" width="100" />
            <el-table-column label="门限类型" align="center" prop="mTypeId" :formatter="mTypeIdFormat" width="100" />
            <el-table-column label="操作" align="center" width="250" fixed="right">
              <template slot-scope="scope">
                <el-button slot="reference" size="mini" type="primary" @click="onClickMTypeBtn(scope.row)"> 编辑门限 </el-button>
                <!-- <el-button slot="reference" size="mini" type="primary" @click="onClickXingBianBtn(scope.row)"> 形变监测 </el-button> -->
              </template>
            </el-table-column>
          </el-table>

          <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageIndex" :radar-point-name="inputRadarPointName" :limit.sync="queryParams.pageSize" @pagination="radarPointList" />
        </el-card>

        <!-- <el-table v-loading="loading" :data="alarmRuleList" row-key="id" default-expand-all border :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" :row-style="handleRowStyle">
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
        </el-table> -->

        <!-- 编辑弹窗-->
        <AlarmPointEditPop :visible.sync="openAlarmRuleEditPop" :m-type-id="mTypeId" :dept-id="inputDeptId" :radar-point-id="inputRadarPointId" @updateAlarmEvent="onUpdateAlarmEvent" />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { Alarm, Dept, PopActionType, Radar, RadarPoint } from "@/store/singleton/app";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import moment from "moment";
import AlarmPointEditPop from "./AlarmPointEditPop.vue";

export default {
  name: "AlarmPoint",
  components: { AlarmPointEditPop },
  data() {
    return {
      // 遮罩层
      loading: true,
      /** 机构树选项 */
      deptOptions: [],
      /** 输入的机构Id */
      inputDeptId: 0,
      /** 监测类型 */
      alarmCheckTypeOptions: Alarm.AlarmCheckTypeOptions,
      /** 输入的监测类型 */
      inputAlarmCheckType: "",
      /** 预警规则列表 */
      alarmRuleList: [],
      /** 弹窗类型 */
      popAction: PopActionType.UNDEFINED,
      /** 打开编辑弹窗 */
      openAlarmRuleEditPop: false,
      // 表单参数
      // alarmRuleRow: {},
      /** 雷达树选项 */
      radarOptions: [],
      // 总条数
      total: 0,
      // 雷达点位信息列表
      radarPointList: [],
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        radarIds: []
      },
      inputRadarPointId: 0, //
      inputRadarPointName: "", //
      mTypeId: 0 // 编辑门限类型
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
      await this.getRadarList();
      await this.getRadarPointList();
      this.loading = false;
    },

    /** 查询机构列表 */
    async getDetpList() {
      this.deptOptions = [];
      this.deptOptions = await Dept.GetDeptListFormatSelect(this.queryParams);
      this.inputDeptId = this.deptOptions[0]?.value || "";
    },
    /** 查询雷达列表 */
    async getRadarList() {
      let deptId = this.inputDeptId;
      console.log("deptId:", deptId);
      this.radarOptions = [];
      this.radarOptions = await Radar.GetRadarListByDeptId(deptId);
      console.log("this.radarOptions:", this.radarOptions);
    },

    async getRadarPointList() {
      console.log("查询雷达点位信息:");
      console.log("deptId:", this.inputDeptId);
      this.queryParams.deptId = this.inputDeptId;
      let resp = await RadarPoint.GetPointListByDeptId(this.addDateRange(this.queryParams, this.dateRange));
      let { list, count } = resp;
      this.radarPointList = list;
      this.total = count;
    },

    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 切换deptId事件
    onChangeDeptEvent() {
      this.getRadarPointList();
    },

    /** 搜索按钮操作 */
    // onHandleQuery() {
    //   console.log("搜索");
    //   this.getAlarmRules();
    // },

    /** 全局门限按钮操作 */
    onClickGlobalBtn() {
      // let deptId = this.inputDeptId;
      // this.alarmRuleRow = Alarm.CreateEmptyAlarmRule(deptId);
      this.modeTypeId = 0;
      this.inputRadarPointId = 0;
      this.inputRadarPointName = "";
      this.openAlarmRuleEditPop = true;
    },

    createdAtFormat(row) {
      console.log("createdAtFormat.row:", row);
      return moment(row.createdAt).format("YYYY-MM-DD HH:mm:ss");
    },
    mTypeIdFormat(row) {
      let t = row.mTypeId;
      if (t == 0) {
        return "全局门限";
      } else {
        return "独立门限";
      }
    },
    aStatusFormat(row) {
      let t = row.aStatus;
      if (t == 0) {
        return "已激活";
      } else {
        return "未激活";
      }
    },

    onClickXingBianBtn(row) {
      console.log("点击形变监测:", row);
    },
    onClickMTypeBtn(row) {
      console.log("编辑门限：", row);
      this.modeTypeId = row.mTypeId;
      this.inputRadarPointId = row.id;
      this.inputRadarPointName = row.PointName;
      this.openAlarmRuleEditPop = true;
    },
    onUpdateAlarmEvent(event) {
      console.log("修改预警规矩事件：", event);
      let { radarPointId, mTypeId } = event;
      if (radarPointId == 0) return;
      this.radarPointList.forEach(item => {
        if (item.id == radarPointId) {
          item.mTypeId = mTypeId;
        }
      });
    },

    handleRowStyle({ row }) {
      if (row.fromProject) {
        return { backgroundColor: "#f0f9eb", color: "#67C23A" };
      }
      return {};
    }
  }
};
</script>

<style scoped>
/* 全局样式 */
.status-green {
  color: green;
  font-weight: bold;
}
</style>
