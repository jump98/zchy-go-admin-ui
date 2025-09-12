import { getAlarmRules } from "@/api/radar/alarm";
import { AlarmCheckList, AlarmLevelType, alarmLevelTypeOptions, AlarmOpOptions, AlarmTypeConfigMap, AlarmTypeList } from "./alarm_const";

export class alarm {
  constructor() {}

  alarmRuleMap = new Map();
  alarmTypeByTypeMap = new Map();
  /** 监测类型 */
  AlarmCheckTypeOptions = AlarmCheckList.map(item => ({
    value: item.checkType,
    label: item.label
  }));
  /** option类型 */
  AlarmOptionModeOptions = [
    {
      value: 1,
      label: "同时满足"
    },
    {
      value: 2,
      label: "满足其一"
    }
  ];

  /** 预警等级 */
  AlarmLevelType = AlarmLevelType;

  /**
   * 获取预警规则列表
   * @param {*} param
   */
  async GetAlarmRules(param) {
    console.log("参数：", param);
    let { deptId } = param;
    let has = this.alarmRuleMap.get(deptId);
    if (has) {
      return has;
    }

    // if (this.alarmRuleList.length != 0) {
    //   return this.alarmRuleList;
    // }
    let resp = await getAlarmRules(param);
    console.log("获取预警列表：", resp);
    let { alarmRule, alarmRuleLevel } = resp;
    if (alarmRule.length === 0) return [];
    alarmRule.forEach(rule => {
      rule.levels = alarmRuleLevel.filter(level => level.alarmRuleId == rule.id);
      rule.alarmCheckTypeValue = alarmRuleLevel.filter(item => item.value == rule.alarmCheckType);
    });
    console.log("alarmRule:", alarmRule);
    this.alarmRuleMap.set(deptId, alarmRule);

    return alarmRule;
  }

  /** 获取预警类型 */
  GetAlarmTypeOptions(checkType) {
    if (!checkType) return;
    console.log("获取预警类型:", checkType);
    let has = this.alarmTypeByTypeMap.get(checkType);
    if (has) {
      return has;
    }

    let data = AlarmTypeList.filter(item => {
      return item.checkType == checkType;
    });
    data = data || [];

    let result = data.map(item => ({
      value: item.alarmType,
      label: item.label
    }));
    this.alarmTypeByTypeMap.set(checkType, result);
    return result;
  }

  /** 创建空的预警规则 */
  CreateEmptyAlarmRule(deptId) {
    let alarmRuleRow = {
      deptId: deptId,
      levels: []
    };
    for (let i = 4; i >= 1; i--) {
      let op = alarmLevelTypeOptions.find(item => item.value === i);
      let row = {
        deptId: deptId,
        alarmLevel: i,
        optionMode: this.AlarmOptionModeOptions[0].value,
        option: [],
        labelClass: op.labelClass,
        labelName: op.label
      };
      alarmRuleRow.levels.push(row);
    }
    console.log("CreateEmptyAlarmRule:", alarmRuleRow);
    return alarmRuleRow;
  }

  /** 获取预警信息类型 */
  GetAlarmTypeConfigById(alarmType) {
    return AlarmTypeConfigMap.get(alarmType);
  }

  /** 获得optionDesc */
  GetOptionDesc(option, optionMode) {
    console.log("option:", option);
    console.log("optionMode:", optionMode);
    let modeItem = this.AlarmOptionModeOptions.find(item => (item.value = optionMode));
    let modeValue = `<span style="color:red; font-weight:bold;">${modeItem.value}</span>:`; // 加红加粗
    let desc = `以下条件${modeValue}`;
    for (let i = 0; i < option.length; i++) {
      let item = option[i];
      let { label, op, value, suffix } = item;
      let opLabel = AlarmOpOptions.find(item => item.value == op).label;
      desc += `(${i})${label}${opLabel}${value}${suffix};`;
    }
    console.log("打印opotionDesc:", desc);
    return desc;
  }
}
