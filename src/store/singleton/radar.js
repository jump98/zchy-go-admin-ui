import { getRadarListByDeptId } from "@/api/radar/sys-radar";

export class radar {
  radarListByDeptIdMap = new Map();

  /** 获得雷达ID */
  async GetRadarListByDeptId(deptId) {
    let has = this.radarListByDeptIdMap.get(deptId);
    if (has) {
      return has;
    }
    console.log("deptId:", deptId);
    let list = await getRadarListByDeptId({ deptId: deptId });
    console.log("获取雷达列表：", list);
    list = list || [];
    if (list.length != 0) {
      this.radarListByDeptIdMap.set(deptId, list);
    }
    return list;
  }

  /** 获取机构列表并且格式化为下拉框列表 */
  async GetRadarListFormatSelect(deptId) {
    console.log("获取机构列表并且格式化为下拉框列表");
    let radarList = await this.GetRadarListByDeptId(deptId);
    console.log("雷达列表:", radarList);

    let options = [];
    for (const item of radarList) {
      let { radarName, radarId, radarKey } = item;
      options.push({ value: radarId, label: radarName, radarKey });
    }
    return options;
  }

  /** 获得雷达信息 */
  async GetRadarItem(deptId, radarId) {
    let radarItem = {};
    let radarList = await this.GetRadarListByDeptId(deptId);
    if (radarList) {
      let radarList2 = [];
      radarItem = radarList2.filter(item => {
        item.id == radarId;
      });
    }
    return radarItem;
  }
}
