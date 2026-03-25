const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// AUTH
export const api = {
  auth: {
    register: (body) => req('POST', '/api/auth/register', body),
    login: (body) => req('POST', '/api/auth/login', body),
    logout: () => req('POST', '/api/auth/logout'),
    me: () => req('GET', '/api/auth/me'),
  },
  classes: {
    list: () => req('GET', '/api/classes'),
    create: (body) => req('POST', '/api/classes', body),
    update: (id, body) => req('PUT', `/api/classes/${id}`, body),
    delete: (id) => req('DELETE', `/api/classes/${id}`),
  },
  students: {
    list: (classId) => req('GET', `/api/classes/${classId}/students`),
    create: (classId, body) => req('POST', `/api/classes/${classId}/students`, body),
    update: (classId, id, body) => req('PUT', `/api/classes/${classId}/students/${id}`, body),
    delete: (classId, id) => req('DELETE', `/api/classes/${classId}/students/${id}`),
  },
  topics: {
    list: (classId) => req('GET', `/api/classes/${classId}/topics`),
    create: (classId, body) => req('POST', `/api/classes/${classId}/topics`, body),
    update: (classId, id, body) => req('PUT', `/api/classes/${classId}/topics/${id}`, body),
    delete: (classId, id) => req('DELETE', `/api/classes/${classId}/topics/${id}`),
  },
  grades: {
    list: (classId) => req('GET', `/api/classes/${classId}/grades`),
    bulk: (classId, body) => req('POST', `/api/classes/${classId}/grades/bulk`, body),
  },
  attendance: {
    list: (classId) => req('GET', `/api/classes/${classId}/attendance`),
    bulk: (classId, body) => req('POST', `/api/classes/${classId}/attendance/bulk`, body),
  },
  notes: {
    list: (classId) => req('GET', `/api/classes/${classId}/notes`),
    create: (classId, body) => req('POST', `/api/classes/${classId}/notes`, body),
    delete: (classId, id) => req('DELETE', `/api/classes/${classId}/notes/${id}`),
  },
  commlog: {
    list: (classId) => req('GET', `/api/classes/${classId}/commlog`),
    create: (classId, body) => req('POST', `/api/classes/${classId}/commlog`, body),
    delete: (classId, id) => req('DELETE', `/api/classes/${classId}/commlog/${id}`),
  },
  timetable: {
    list: (classId) => req('GET', `/api/classes/${classId}/timetable`),
    save: (classId, body) => req('POST', `/api/classes/${classId}/timetable`, body),
    delete: (classId, body) => req('DELETE', `/api/classes/${classId}/timetable`, body),
  },
};
