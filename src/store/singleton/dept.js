import { getDeptList } from "@/api/admin/sys-dept";

export class dept {
  deptList = []; // 机构列表

  async GetDeptList(param) {
    if (this.deptList.length != 0) {
      return this.deptList;
    }
    let resp = await getDeptList(param);
    console.log("获取机构列表：", resp);
    this.deptList = resp.data || [];
    return this.deptList;
  }

  /** 获取机构列表并且格式化为下拉框列表 */
  async GetDeptListFormatSelect(param) {
    console.log("获取机构列表并且格式化为下拉框列表");
    let deptList = await this.GetDeptList(param);
    console.log("deptList:", deptList);

    let options = [];
    for (const item of deptList) {
      let { deptName, deptId } = item;
      options.push({ value: deptId, label: deptName });
    }
    return options;
  }
}
