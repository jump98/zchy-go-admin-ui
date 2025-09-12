import request from "@/utils/request_v2";

// 查询SysRadar列表
export function getAlarmRules(query) {
  return request({
    url: "/api/v1/alarm/getAlarmRules",
    method: "get",
    params: query
  });
}
