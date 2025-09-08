<template>
  <BasicLayout>
    <template #wrapper>
      <RadarImage v-if="checkThisPermission(['radar:radarPoint:edit'])" :radar-id="radarId" :radar-point-list="radarPointList" @addRadarPointEvent="onClickRadarPointEvent" />

      <el-divider>雷达监测点列表</el-divider>
      <el-card class="box-card">
        <el-table v-loading="loading" :data="radarPointList" @selection-change="onSelectionChange">
          <el-table-column label="名称" align="center" prop="pointName" :show-overflow-tooltip="true" />
          <el-table-column label="编号" align="center" prop="pointKey" :show-overflow-tooltip="true" />
          <el-table-column label="下标" align="center" prop="pointIndex" :show-overflow-tooltip="true" />
          <el-table-column label="类型" align="center" prop="pointType" :formatter="pointTypeFormat" width="100">
            <template slot-scope="scope">
              {{ pointTypeFormat(scope.row) }}
            </template>
          </el-table-column>
          <!-- <el-table-column label="雷达" align="center" prop="radarId" :formatter="radarIdFormat" width="100">
            <template slot-scope="scope">
              {{ radarIdFormat(scope.row) }}
            </template>
          </el-table-column> -->
          <el-table-column label="经度" align="center" prop="lng" :show-overflow-tooltip="true" /><el-table-column label="纬度" align="center" prop="lat" :show-overflow-tooltip="true" />
          <el-table-column label="高度" align="center" prop="alt" :show-overflow-tooltip="true" /><el-table-column label="距离" align="center" prop="distance" :show-overflow-tooltip="true" />
          <el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" />
          <el-table-column label="激活状态" align="center" prop="aStatus" :formatter="aStatusFormat" width="100">
            <template slot-scope="scope">
              {{ aStatusFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="消警状态" align="center" prop="xStatus" :formatter="xStatusFormat" width="100">
            <template slot-scope="scope">
              {{ xStatusFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="门限类型" align="center" prop="mTypeId" :formatter="mTypeIdFormat" width="100">
            <template slot-scope="scope">
              {{ mTypeIdFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="250" fixed="right">
            <template slot-scope="scope">
              <el-button slot="reference" size="mini" type="primary" @click="onClickXingBianBtn(scope.row)"> 数据 </el-button>
              <el-button slot="reference" v-permisaction="['radar:radarPoint:edit']" size="mini" type="success" @click="onClickUpdateBtn(scope.row)"> 修改 </el-button>
              <el-button slot="reference" v-permisaction="['radar:radarPoint:remove']" size="mini" type="danger" @click="onClickDeleteBtn(scope.row)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageIndex" :limit.sync="queryParams.pageSize" @pagination="getList" />

        <!-- 添加或修改对话框 -->
        <PointEditDialog
          :visible.sync="openDialog"
          :radar-point-row="radarPointRow"
          :x-status-options="xStatusOptions"
          :m-type-id-options="mTypeIdOptions"
          :a-status-options="aStatusOptions"
          :point-type-options="pointTypeOptions"
          :radar-id-options="radarIdOptions"
          :radar-id="radarId"
          :dialog-action="dialogAction"
          @addRadarPointSuccesEvent="onAddRadarPointSuccesEvent"
        />

        <!-- 监控点信息弹窗-->
        <RadarPointDetailDialog v-if="openRedarPointDetailDialog" :visible.sync="openRedarPointDetailDialog" :radar-info="radarInfo" :radar-point-info="radarPointRow" />
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { delRadarPoint, getRadarPointList } from "@/api/radar/radar-point";

import { getRadarList } from "@/api/radar/sys-radar";
import RadarImage from "./RadarImage.vue";
import RadarPointDetailDialog from "./RadarPointDetailDialog.vue";
import PointEditDialog from "./PointEditDialog.vue";
import { checkPermission } from "@/utils/permission";
export default {
  name: "RadarPoint",
  components: {
    RadarImage,
    PointEditDialog,
    RadarPointDetailDialog
  },
  props: {
    radarId: {
      type: Number,
      default: 0
    },
    radarInfo: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      // 遮罩层
      loading: false,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 总条数
      total: 0,
      // 是否显示弹出层
      openDialog: false,
      // 弹窗action
      dialogAction: 0, // 1=修改 2=增加
      // 类型数据字典
      typeOptions: [],
      // 雷达点位信息列表
      radarPointList: [],
      // 检测点类型
      pointTypeOptions: [],
      // 激活状态
      aStatusOptions: [],
      xStatusOptions: [],
      mTypeIdOptions: [],
      // 关系表类型
      radarIdOptions: [],
      // 查询参数
      queryParams: {
        pageIndex: 1,
        pageSize: 10,
        id: undefined,
        pointName: undefined,
        pointKey: undefined,
        radarId: undefined,
        aStatus: undefined
      },
      // 表单参数
      radarPointRow: {},
      openRedarPointDetailDialog: false // 控制雷达点位弹出框显示
    };
  },

  watch: {
    // radarId: {
    //   handler(newVal) {
    //     console.log("index.vue.radarId=", newVal);
    //   }
    // }
  },
  created() {
    this.getList();
    this.getDicts("radar_point_type").then(response => {
      this.pointTypeOptions = response.data;
    });
    this.getSysRadarItems();
    this.getDicts("radar_astatus").then(response => {
      this.aStatusOptions = response.data;
    });
    this.getDicts("radar_xstatus").then(response => {
      this.xStatusOptions = response.data;
    });
    this.getDicts("radar_threshold").then(response => {
      this.mTypeIdOptions = response.data;
    });
  },
  methods: {
    checkThisPermission(value) {
      let ok = checkPermission(value);
      console.log("checkPermission(value):", checkPermission(value));
      return ok;
    },
    /** 查询RadarPoint列表 */
    async getList(radarId) {
      console.log("查询雷达点位信息，radarid:", radarId);
      if (!radarId) radarId = this.radarId;
      if (!radarId) return;
      this.loading = true;
      this.queryParams.radarId = radarId;
      let resp = await getRadarPointList(this.addDateRange(this.queryParams, this.dateRange));
      let { list, count } = resp.data;
      this.radarPointList = list;
      this.total = count;
      this.loading = false;
    },
    pointTypeFormat(row) {
      return this.selectDictLabel(this.pointTypeOptions, row.pointType);
    },
    radarIdFormat(row) {
      return this.selectItemsLabel(this.radarIdOptions, row.radarId);
    },
    aStatusFormat(row) {
      return this.selectDictLabel(this.aStatusOptions, row.aStatus);
    },
    xStatusFormat(row) {
      return this.selectDictLabel(this.xStatusOptions, row.xStatus);
    },
    mTypeIdFormat(row) {
      return this.selectDictLabel(this.mTypeIdOptions, row.mTypeId);
    },
    // 获得关系表数据
    // TODO: 需要优化
    getSysRadarItems() {
      console.log("getSysRadarItems");
      this.getItems(getRadarList, undefined).then(res => {
        console.log("获得关系表数据.getItems:", res);
        this.radarIdOptions = this.setItems(res, "radarId", "radarName");
        console.log("获得关系表数据:", this.radarIdOptions);
      });
    },
    // 点击点事件
    onClickRadarPointEvent(data) {
      console.log("新增点位：", data);
      this.radarPointRow = { pointIndex: data.index };
      this.openDialog = true;
      this.title = "添加新的监测点";
      this.dialogAction = 2;
    },
    // 多选框选中数据
    onSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 修改按钮操作 */
    async onClickUpdateBtn(row) {
      console.log("修改点位信息", row);
      this.radarPointRow = row;
      this.openDialog = true;
      this.dialogAction = 1;
    },
    // 添加点成功事件
    onAddRadarPointSuccesEvent(data) {
      console.log("添加点成功事件:", data);
      this.radarPointList.push(data);
    },

    /** 删除按钮操作 */
    onClickDeleteBtn(row) {
      var Ids = (row.id && [row.id]) || this.ids;
      this.$confirm('是否确认删除编号为"' + Ids + '"的数据项?', "警告", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(function () {
          return delRadarPoint({ ids: Ids });
        })
        .then(response => {
          if (response.code === 200) {
            this.msgSuccess(response.msg);
            this.getList();
          } else {
            this.msgError(response.msg);
          }
        })
        .catch(function () {});
    },
    // 点击形变按钮
    onClickXingBianBtn(row) {
      console.log("点击形变数据:", row);
      this.radarPointRow = row;
      this.openRedarPointDetailDialog = true;
    }
  }
};
</script>
