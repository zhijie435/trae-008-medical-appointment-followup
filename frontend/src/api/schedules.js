import request from '@/utils/request';

export function getScheduleList(params) {
  return request({
    url: '/schedules',
    method: 'get',
    params
  });
}

export function getMonthSchedule(year, month) {
  return request({
    url: `/schedules/month/${year}/${month}`,
    method: 'get'
  });
}

export function getSchedule(id) {
  return request({
    url: `/schedules/${id}`,
    method: 'get'
  });
}

export function createSchedule(data) {
  return request({
    url: '/schedules',
    method: 'post',
    data
  });
}

export function updateSchedule(id, data) {
  return request({
    url: `/schedules/${id}`,
    method: 'put',
    data
  });
}

export function updateScheduleStatus(id, data) {
  return request({
    url: `/schedules/${id}/status`,
    method: 'patch',
    data
  });
}

export function deleteSchedule(id) {
  return request({
    url: `/schedules/${id}`,
    method: 'delete'
  });
}

export function getScheduleDepartments() {
  return request({
    url: '/schedules/departments',
    method: 'get'
  });
}

export function getScheduleDoctors(department) {
  return request({
    url: '/schedules/doctors',
    method: 'get',
    params: department ? { department } : {}
  });
}

export function checkScheduleConflict(data) {
  return request({
    url: '/schedules/check-conflict',
    method: 'post',
    data
  });
}
