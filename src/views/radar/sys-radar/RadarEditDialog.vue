<template>
  <el-dialog :title="title" :visible.sync="openDialog" width="600px" :close-on-click-modal="false">
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
      <el-button type="primary" @click="onClickSubmitFormBtn">确 定</el-button>
      <el-button @click="onClickCancelBtn">取 消</el-button>
    </div>
  </el-dialog>
</template>

<script>
export default {};
</script>

<style></style>
