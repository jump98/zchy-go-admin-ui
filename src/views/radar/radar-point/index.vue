<template>
  <BasicLayout>
    <template #wrapper>
      <RadarImage v-if="checkThisPermission(['admin:radarPoint:edit'])" :radarid="radarid" @sigAddRadarPoint="onAddRadarPoint" />
      <el-divider>以下是当前的雷达的监测点列表</el-divider>
      <el-card class="box-card">
        <el-table v-loading="loading" :data="radarPointList" @selection-change="handleSelectionChange">
          <el-table-column label="名称" align="center" prop="pointName" :show-overflow-tooltip="true" />
          <el-table-column label="编号" align="center" prop="pointKey" :show-overflow-tooltip="true" />
          <el-table-column label="下标" align="center" prop="pointIndex" :show-overflow-tooltip="true" />
          <el-table-column label="类型" align="center" prop="pointType" :formatter="pointTypeFormat" width="100">
            <template slot-scope="scope">
              {{ pointTypeFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="雷达" align="center" prop="radarId" :formatter="radarIdFormat" width="100">
            <template slot-scope="scope">
              {{ radarIdFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="经度" align="center" prop="lng" :show-overflow-tooltip="true" /><el-table-column label="纬度" align="center" prop="lat" :show-overflow-tooltip="true" /> <el-table-column label="高度" align="center" prop="alt" :show-overflow-tooltip="true" /><el-table-column
            label="距离"
            align="center"
            prop="distance"
            :show-overflow-tooltip="true"
          /><el-table-column label="备注" align="center" prop="remark" :show-overflow-tooltip="true" /><el-table-column label="激活状态" align="center" prop="aStatus" :formatter="aStatusFormat" width="100">
            <template slot-scope="scope">
              {{ aStatusFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="消警状态" align="center" prop="xStatus" :formatter="xStatusFormat" width="100">
            <template slot-scope="scope">
              {{ xStatusFormat(scope.row) }}
            </template> </el-table-column
          ><el-table-column label="门限类型" align="center" prop="mTypeId" :formatter="mTypeIdFormat" width="100">
            <template slot-scope="scope">
              {{ mTypeIdFormat(scope.row) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button slot="reference" v-permisaction="['admin:radarPoint:edit']" size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)"> 修改 </el-button>
              <el-button slot="reference" v-permisaction="['admin:radarPoint:remove']" size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageIndex" :limit.sync="queryParams.pageSize" @pagination="getList" />

        <!-- 添加或修改对话框 -->
        <el-dialog :title="title" :visible.sync="open" width="700px" :close-on-click-modal="false">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-row>
              <el-col :span="12">
                <el-form-item label="雷达" prop="radarId">
                  <el-select v-model="radarid" placeholder="请选择" disabled>
                    <el-option v-for="dict in radarIdOptions" :key="dict.key" :label="dict.value" :value="dict.key" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="监测点类型" prop="pointType">
                  <el-select v-model="form.pointType" placeholder="请选择">
                    <el-option v-for="dict in pointTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="监测点名称" prop="pointName">
              <el-input v-model="form.pointName" placeholder="监测点名称" />
            </el-form-item>
            <el-form-item label="监测点编号" prop="pointKey">
              <el-input v-model="form.pointKey" placeholder="监测点编号" />
            </el-form-item>
            <el-row>
              <el-col :span="12">
                <el-form-item label="经度" prop="lng">
                  <el-input v-model="form.lng" placeholder="经度" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="纬度" prop="lat">
                  <el-input v-model="form.lat" placeholder="纬度" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="11">
                <el-form-item label="高度" prop="alt">
                  <el-input v-model="form.alt" placeholder="高度" />
                </el-form-item>
              </el-col>
              <el-col :span="1"><label class="el-form-item__label">米</label></el-col>
              <el-col :span="11">
                <el-form-item label="距离" prop="distance">
                  <el-input v-model="form.distance" placeholder="距离" />
                </el-form-item>
              </el-col>
              <el-col :span="1"><label class="el-form-item__label">米</label></el-col>
            </el-row>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" placeholder="备注" />
            </el-form-item>
            <el-row>
              <el-col :span="12">
                <el-form-item label="激活状态" prop="aStatus">
                  <el-select v-model="form.aStatus" placeholder="请选择">
                    <el-option v-for="dict in aStatusOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="消警状态" prop="xStatus">
                  <el-select v-model="form.xStatus" placeholder="请选择">
                    <el-option v-for="dict in xStatusOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="门限类型" prop="mTypeId">
                  <el-select v-model="form.mTypeId" placeholder="请选择">
                    <el-option v-for="dict in mTypeIdOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="下标" prop="pointIndex">
                  <el-input-number v-model.number="form.pointIndex" placeholder="请输入0-1999之间的数字" :controls="false" class="lnglatnumber" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <div slot="footer" class="dialog-footer">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </el-dialog>
      </el-card>
    </template>
  </BasicLayout>
</template>

<script>
import { addRadarPoint, delRadarPoint, getRadarPoint, listRadarPoint, updateRadarPoint } from "@/api/admin/radar-point";

import { formValidation } from "@/utils/validate";
import { listSysRadar } from "@/api/admin/sys-radar";
import RadarImage from "./RadarImage.vue";
import { checkPermission } from "@/utils/permission";
export default {
  name: "RadarPoint",
  components: {
    RadarImage
  },
  props: {
    radarid: {
      type: Number,
      default: 0
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
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      isEdit: false,
      // 类型数据字典
      typeOptions: [],
      radarPointList: [],
      pointTypeOptions: [],
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
      form: {},
      // 表单校验
      rules: {
        id: [{ required: true, message: "PointID不能为空", trigger: "blur" }],
        pointName: [{ required: true, message: "监测点名称不能为空", trigger: "blur" }],
        pointKey: [{ required: true, message: "监测点编号不能为空", trigger: "blur" }],
        aStatus: [{ required: true, message: "激活状态不能为空", trigger: "blur" }],
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
        pointIndex: [
          {
            validator: (rule, value, callback) => {
              if (value === undefined || value === "" || value < 0 || value > 19999) {
                callback(new Error("请输入0-19999之间的数字"));
              } else {
                callback();
              }
            },
            trigger: "blur" // 触发校验的时机
          }
        ]
      }
    };
  },

  ///
  watch: {
    radarid: {
      handler(newVal) {
        console.log("index.vue.radarid=", newVal);
      },
      deep: true
    }
  },
  created() {
    this.getList();
    this.getDicts("radar_pointtype").then(response => {
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
      return checkPermission(value);
    },
    /** 查询参数列表 */
    getList(radarid) {
      console.log("查询雷达点位信息，radarid:", radarid);
      if (!radarid) {
        radarid = this.radarid;
      }
      if (!radarid) return;
      this.loading = true;
      this.queryParams.radarId = radarid;
      listRadarPoint(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.radarPointList = response.data.list;
        this.total = response.data.count;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: undefined,
        pointName: undefined,
        pointKey: undefined,
        pointType: undefined,
        radarId: this.radarid,
        lng: undefined,
        lat: undefined,
        alt: undefined,
        distance: undefined,
        remark: undefined,
        aStatus: undefined,
        xStatus: undefined,
        mTypeId: undefined
      };
      this.resetForm("form");
    },
    getImgList: function () {
      this.form[this.fileIndex] = this.$refs["fileChoose"].resultList[0].fullUrl;
    },
    fileClose: function () {
      this.fileOpen = false;
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
    // 关系
    getSysRadarItems() {
      this.getItems(listSysRadar, undefined).then(res => {
        this.radarIdOptions = this.setItems(res, "radarId", "radarName");
      });
    },
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
      this.handleQuery();
    },
    /** 新增按钮操作 */
    handleAdd(data) {
      console.log("handleAdd", data);
      this.reset();
      this.form.pointIndex = data.index;
      this.open = true;
      this.title = "添加新的监测点";
      this.isEdit = false;
    },
    onAddRadarPoint(data) {
      this.handleAdd(data);
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      //const id = row.id || this.ids
      const id = row.id || this.ids;
      console.log("id=", id, "row=", row);
      getRadarPoint(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改监测点管理";
        this.isEdit = true;
      });
    },
    /** 提交按钮 */
    submitForm: function () {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id !== undefined) {
            updateRadarPoint(this.form).then(response => {
              if (response.code === 200) {
                this.msgSuccess(response.msg);
                this.open = false;
                this.getList();
              } else {
                this.msgError(response.msg);
              }
            });
          } else {
            addRadarPoint(this.form).then(response => {
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
            this.open = false;
            this.getList();
          } else {
            this.msgError(response.msg);
          }
        })
        .catch(function () {});
    }
  }
};
</script>
