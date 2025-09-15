import request from "@/utils/request_v2";

// 查询点位预警规则列表
export function getPointAlarmRules(query) {
  return request({
    url: "/api/v1/alarm/getPointAlarmRules",
    method: "get",
    params: query
  });
}

// 修改点位预警规则
export function updatePointAlarmRules(data) {
  return request({
    url: "/api/v1/alarm/updatePointAlarmRules",
    method: "post",
    data: data
  });
}
