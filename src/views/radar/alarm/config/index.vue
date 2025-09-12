<template>
  <BasicLayout>
    <template #wrapper> 预警关联 </template>
  </BasicLayout>
</template>

<script>
import { getDeptList, getDept, delDept, addDept, updateDept } from "@/api/admin/sys-dept";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";

export default {
  name: "AlarmConfig"
};
</script>