import request from "@/utils/request";

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
export function listDeptRadarPoint(query) {
  return request({
    url: "/api/v1/radar_point/getDeptList",
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
 * 获取形变速率数据
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
