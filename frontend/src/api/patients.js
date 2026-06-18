import request from '@/utils/request';

export function getPatientList(params) {
  return request({
    url: '/patients',
    method: 'get',
    params
  });
}

export function getAllPatients() {
  return request({
    url: '/patients/all',
    method: 'get'
  });
}

export function getPatient(id) {
  return request({
    url: `/patients/${id}`,
    method: 'get'
  });
}

export function createPatient(data) {
  return request({
    url: '/patients',
    method: 'post',
    data
  });
}

export function updatePatient(id, data) {
  return request({
    url: `/patients/${id}`,
    method: 'put',
    data
  });
}

export function deletePatient(id) {
  return request({
    url: `/patients/${id}`,
    method: 'delete'
  });
}

export function getPatientDepartments() {
  return request({
    url: '/patients/departments',
    method: 'get'
  });
}
