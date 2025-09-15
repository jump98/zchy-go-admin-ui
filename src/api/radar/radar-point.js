import request from "@/utils/request";
import requestV2 from "@/utils/request_v2";

// 查询RadarPoint列表
export function getRadarPointList(query) {
  return request({
    url: "/api/v1/radar_point/getList",
    method: "get",
    params: query
  });
}
/**
 * 查询部门下的RadarPoint列表
 * @param {*} query
 * @returns
 */
export function getPointListByDeptId(query) {
  return requestV2({
    url: "/api/v1/radar_point/getPointListByDeptId",
    method: "get",
    params: query
  });
}
// 查询部门下的RadarPoint形变数据
export function listDeptRadarPointDeformationData(query) {
  return request({
    url: "/api/v1/radar_point/deformation/data",
    method: "get",
    params: query
  });
}
// 查询RadarPoint详细
export function getRadarPoint(id) {
  return request({
    url: "/api/v1/radar_point/getById/" + id,
    method: "get"
  });
}

// 新增RadarPoint
export function addRadarPoint(data) {
  return request({
    url: "/api/v1/radar_point/add",
    method: "post",
    data: data
  });
}

// 修改RadarPoint
export function updateRadarPoint(data) {
  return request({
    url: "/api/v1/radar_point/update/" + data.id,
    method: "put",
    data: data
  });
}

// 删除RadarPoint
export function delRadarPoint(data) {
  return request({
    url: "/api/v1/radar_point/delete",
    method: "delete",
    data: data
  });
}

/**
 * 获取变形点数据
 * @param {*} data
 * @returns
 */
export function getRadarPointDeformData(data) {
  return request({
    url: "/api/v1/radar_point/getDeformationData",
    method: "post",
    data: data
  });
}

/**
 * 获取形变速度数据
 * @param {*} data
 * @returns
 */
export function getDeformationVelocity(data) {
  return request({
    url: "/api/v1/radar_point/getDeformationVelocity",
    method: "post",
    data: data
  });
}

/**
 * 获取形变加速度数据
 * @param {*} data
 * @returns
 */
export function getDeformationAcceleration(data) {
  return request({
    url: "/api/v1/radar_point/getDeformationAcceleration",
    method: "post",
    data: data
  });
}

// 获得点位列表根据雷达Ids
export function getPointListByRadarIds(data) {
  return requestV2({
    url: "/api/v1/radar_point/getPointListByRadarIds",
    method: "post",
    data: data
  });
}
