/** 预警等级 */
export const AlarmLevelType = {
  Red: 1,
  Orange: 2,
  Yellow: 3,
  Blue: 4
};

/** 预警等级 options */
export const alarmLevelTypeOptions = [
  {
    value: AlarmLevelType.Blue,
    label: "蓝色预警",
    labelClass: "blue_label"
  },
  {
    value: AlarmLevelType.Yellow,
    label: "黄色预警",
    labelClass: "yellow_label"
  },
  {
    value: AlarmLevelType.Orange,
    label: "橙色预警",
    labelClass: "orange_label"
  },
  {
    value: AlarmLevelType.Red,
    label: "红色预警",
    labelClass: "red_label"
  }
];

/** 运算符 */
export const AlarmOpOptions = [
  {
    value: 1,
    label: "="
  },
  {
    value: 2,
    label: ">"
  },
  {
    value: 3,
    label: "<"
  },
  {
    value: 4,
    label: ">="
  },
  {
    value: 5,
    label: "<="
  },
  {
    value: 6,
    label: "<>",
    remark: "表示n>=-x并n<=x"
  },
  {
    value: 7,
    label: "><",
    remark: "表示n<-x或n>x"
  }
];

/** 监测列表 */
export const AlarmCheckList = [
  {
    checkType: 1,
    label: "雷达状态信息"
  },
  {
    checkType: 2,
    label: "地表位移"
  },
  {
    checkType: 3,
    label: "速度"
  },
  {
    checkType: 4,
    label: "加速度"
  }
];

/** 预警列表 */
export const AlarmTypeList = [
  {
    checkType: 1,
    alarmType: 1000,
    label: "基本状态",
    cond: [
      {
        label: "1.当前供电电压",
        field: "gddy", // 供电电压
        op: "", // 运算符
        value: "",
        hint: "预警值",
        suffix: "v;"
      },
      {
        label: "2.当前电池剩量",
        field: "dcsl", // 当前电压
        op: "", // 运算符
        value: "",
        hint: "预警值",
        suffix: "v;"
      },
      {
        label: "3.当前电池剩量",
        field: "dcsl3", // 当前电压
        op: "", // 运算符
        value: "",
        hint: "预警值",
        suffix: "v;"
      },
      {
        label: "4.当前电池剩量",
        field: "dcsl4", // 当前电压
        op: "", // 运算符
        value: "",
        hint: "预警值",
        suffix: "v;"
      }
    ]
  },
  {
    checkType: 1,
    alarmType: 1001,
    label: "基本状态2",
    cond: [
      {
        label: "1.当前供电电压",
        field: "gddy", // 供电电压
        op: "", // 运算符
        value: "",
        hint: "预警值",
        suffix: "v;"
      },
      {
        label: "2.当前电池剩量",
        field: "dcsl", // 当前电压
        op: "", // 运算符
        value: "",
        hint: "预警值",
        suffix: "v;"
      }
    ]
  }
];

/** 预警信息类型 key=预警ID */
export const AlarmTypeConfigMap = new Map(AlarmTypeList.map(item => [item.alarmType, item]));
