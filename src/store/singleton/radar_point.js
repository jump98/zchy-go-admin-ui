import { getPointListByDeptId } from "@/api/radar/radar-point";

import moment from "moment";
export class radarPoint {
  radarPointByDeptIdMap = new Map();

  /**
   * TODO:这是分页查询
   * 根据deptId获得所有监测点
   */
  async GetPointListByDeptId(param) {
    console.log("GetPointListByDeptId.param:", param);
    // let { deptId } = param;
    // let has = this.radarPointByDeptIdMap.get(deptId);
    // if (has) {
    //   return has;
    // }

    // if (this.alarmRuleList.length != 0) {
    //   return this.alarmRuleList;
    // }
    let resp = await getPointListByDeptId(param);
    console.log("获取监测点预警列表：", resp);
    resp.list = resp.list || [];
    for (let i = 0; i < resp.list.length; i++) {
      resp.list[i].createdAtStr = moment(resp.list[i].createdAt).format("YYYY-MM-DD HH:mm:ss");
    }

    return resp;
  }
}
