import { getPointListByDeptId } from "@/api/radar/radar-point";

import moment from "moment";
export class radarPoint {
  radarPointList = []; // 机构列表
  radarPointByDeptIdMap = new Map();

  /** 获得雷达ID */
  // async GetPointListByRadarIds(param) {
  //   if (this.radarPointList.length != 0) {
  //     return this.radarPointList;
  //   }
  //   let resp = await getPointListByRadarIds(param);
  //   console.log("获取雷达点位列表：", resp);
  //   this.radarPointList = resp.data || [];
  //   return this.radarPointList;
  // }

  /**
   * TODO:这是分页查询
   * 根据deptId获得所有监测点
   */
  async GetPointListByDeptId(param) {
    console.log("GetPointListByDeptId.param:", param);
    // let { deptId } = param;
    // let has = this.alarmRuleMap.get(deptId);
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
      // resp.list[i].aStatus = aStatusMap(resp.list[i].aStatus);
    }

    return resp;
  }

  /** 获取机构列表并且格式化为下拉框列表 */
  // async GetRadarListFormatSelect(deptId) {
  //   console.log("获取机构列表并且格式化为下拉框列表");
  //   let radarList = await this.getRadarListByDeptId({ deptId });
  //   console.log("雷达列表:", radarList);

  //   let options = [];
  //   for (const item of radarList) {
  //     let { radarName, radarId, radarKey } = item;
  //     options.push({ value: radarId, label: radarName, radarKey });
  //   }
  //   return options;
  // }
}

const aStatusMap = {
  0: "未激活",
  1: "已激活"
};
