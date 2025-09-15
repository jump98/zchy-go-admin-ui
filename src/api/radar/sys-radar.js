import request from "@/utils/request";
import requestV2 from "@/utils/request_v2";

// 查询SysRadar列表
export function getRadarList(query) {
  console.log("getRadarList.query:", query);
  return request({
    url: "/api/v1/radar_info",
    method: "get",
    params: query
  });
}

// 查询SysRadar详细
export function getSysRadar(radarId) {
  return request({
    url: "/api/v1/radar_info/" + radarId,
    method: "get"
  });
}

// 获取雷达影像
export function getSysRadarImage(radarId) {
  return request({
    url: "/api/v1/radar_info/radarimage/" + radarId,
    method: "get"
  });
}

// 新增SysRadar
export function addSysRadar(data) {
  return request({
    url: "/api/v1/radar_info",
    method: "post",
    data: data
  });
}

// 修改SysRadar
export function updateSysRadar(data) {
  return request({
    url: "/api/v1/radar_info/" + data.radarId,
    method: "put",
    data: data
  });
}

// 删除SysRadar
export function delSysRadar(data) {
  return request({
    url: "/api/v1/radar_info",
    method: "delete",
    data: data
  });
}

// 获取雷达告警信息
export function getRadarsAlarms(data) {
  return request({
    url: "/api/v1/radar_info/get_alarms",
    method: "post",
    data: data
  });
}

// 获取雷达设备信息
export function getRadarDevInfo(data) {
  return request({
    url: "/api/v1/radar_info/get_dev_info",
    method: "post",
    data: data
  });
}

// 获取雷达状态信息
export function getRadarStateInfo(data) {
  return request({
    url: "/api/v1/radar_info/get_state_info",
    method: "post",
    data: data
  });
}

// 获取雷达告警信息
export function getRadarAlarmsBefore(data) {
  return request({
    url: "/api/v1/radar_info/get_alarms_before",
    method: "post",
    data: data
  });
}

// 获得雷达列表
export function getRadarListByDeptId(data) {
  return requestV2({
    url: "/api/v1/radar_info/getRadarListByDeptId",
    method: "post",
    data: data
  });
}
