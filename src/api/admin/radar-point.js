import request from '@/utils/request'

// 查询RadarPoint列表
export function listRadarPoint(query) {
    return request({
        url: '/api/v1/radar-point',
        method: 'get',
        params: query
    })
}
// 查询部门下的RadarPoint列表
export function listDeptRadarPoint(query) {
    return request({
        url: '/api/v1/radar-point/dept',
        method: 'get',
        params: query
    })
}
// 查询部门下的RadarPoint形变数据
export function listDeptRadarPointDeformationData(query) {
    return request({
        url: '/api/v1/radar-point-deformation',
        method: 'get',
        params: query
    })
}
// 查询RadarPoint详细
export function getRadarPoint (id) {
    return request({
        url: '/api/v1/radar-point/' + id,
        method: 'get'
    })
}


// 新增RadarPoint
export function addRadarPoint(data) {
    return request({
        url: '/api/v1/radar-point',
        method: 'post',
        data: data
    })
}

// 修改RadarPoint
export function updateRadarPoint(data) {
    return request({
        url: '/api/v1/radar-point/'+data.id,
        method: 'put',
        data: data
    })
}

// 删除RadarPoint
export function delRadarPoint(data) {
    return request({
        url: '/api/v1/radar-point',
        method: 'delete',
        data: data
    })
}


// 新增RadarPoint
export function getRadarPointDeformData(data) {
    return request({
        url: '/api/v1/radar-point/deformation-data',
        method: 'post',
        data: data
    })
}