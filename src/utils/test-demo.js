import moment from "moment";

/**
 * 测试数据
 */
class testData {
  GetPointDeformData(timeType, append, last_time) {
    console.log("打印:", timeType, append, last_time);
    switch (timeType) {
      case "seconds":
        return this.getDeformSecondData(append, last_time);
      case "minutes":
        return this.getDeformMinuteData(append, last_time);
      case "hours":
        return this.getDeformHourData(append, last_time);
      case "days":
        return this.getDeformDayData(append, last_time);
      default:
        return {};
    }
  }

  // 秒级数据
  getDeformSecondData(append, last_time) {
    return this._generateData(append, last_time, "seconds", 100);
  }

  // 分钟级数据
  getDeformMinuteData(append, last_time) {
    return this._generateData(append, last_time, "minutes", 100);
  }

  // 小时级数据
  getDeformHourData(append, last_time) {
    return this._generateData(append, last_time, "hours", 10);
  }

  // 天级数据
  getDeformDayData(append, last_time) {
    return this._generateData(append, last_time, "days", 100);
  }

  // 通用生成函数
  _generateData(append, last_time, unit, count) {
    let list = [];
    if (append && last_time) {
      let t = moment(last_time).clone().add(1, unit);
      list.push({
        SvrTime: t.toISOString(),
        Deformation: Math.floor(Math.random() * 201 - 100),
        Distance: Math.floor(Math.random() * 100000)
      });
    } else {
      let now = moment();
      for (let i = 0; i < count; i++) {
        let t = now.clone().subtract(count - i, unit);
        list.push({
          SvrTime: t.toISOString(),
          Deformation: Math.floor(Math.random() * 201 - 100),
          Distance: Math.floor(Math.random() * 100000)
        });
      }
    }
    let new_last_time = list[list.length - 1].SvrTime;
    return { list, last_time: new_last_time };
  }
}

export const TestData = new testData();
