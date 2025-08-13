import request from '@/utils/request'

export function getDeptList(query) {
  return request({
    url: '/api/v1/dept',
    method: 'get',
    params: query
  })
}

// 查询机构详细
export function getDept(deptId) {
  return request({
    url: '/api/v1/dept/' + deptId,
    method: 'get'
  })
}

// 查询机构下拉树结构
export function treeselect() {
  return request({
    url: '/api/v1/deptTree',
    method: 'get'
  })
}

// 根据角色ID查询机构树结构
export function roleDeptTreeselect(roleId) {
  return request({
    url: '/api/v1/roleDeptTreeselect/' + roleId,
    method: 'get'
  })
}

// 新增机构
export function addDept(data) {
  return request({
    url: '/api/v1/dept',
    method: 'post',
    data: data
  })
}

// 修改机构
export function updateDept(data, id) {
  return request({
    url: '/api/v1/dept/' + id,
    method: 'put',
    data: data
  })
}

// 删除机构
export function delDept(data) {
  return request({
    url: '/api/v1/dept',
    method: 'delete',
    data: data
  })
}
