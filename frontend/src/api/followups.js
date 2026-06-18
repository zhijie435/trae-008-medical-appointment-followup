import request from '@/utils/request';

export function getFollowupList(params) {
  return request({
    url: '/followups',
    method: 'get',
    params
  });
}

export function getFollowup(id) {
  return request({
    url: `/followups/${id}`,
    method: 'get'
  });
}

export function getFollowupsByPatient(patientId) {
  return request({
    url: `/followups/patient/${patientId}`,
    method: 'get'
  });
}

export function createFollowup(data) {
  return request({
    url: '/followups',
    method: 'post',
    data
  });
}

export function updateFollowup(id, data) {
  return request({
    url: `/followups/${id}`,
    method: 'put',
    data
  });
}

export function updateFollowupStatus(id, data) {
  return request({
    url: `/followups/${id}/status`,
    method: 'patch',
    data
  });
}

export function deleteFollowup(id) {
  return request({
    url: `/followups/${id}`,
    method: 'delete'
  });
}
