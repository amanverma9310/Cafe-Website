import { buildForm, http, unwrap, unwrapPage } from './api.js';

const get = (url, params, cfg) => http.get(url, { params, ...cfg }).then(unwrap);
const page = (url, params) => http.get(url, { params }).then(unwrapPage);
const send = (method, url, body, cfg) => http[method](url, body, cfg).then(unwrap);
const withProgress = (onProgress) => ({
  onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
});
const upload = (method, url, payload, files, onProgress) => send(method, url, buildForm(payload, files), withProgress(onProgress));
const admin = { scope: 'admin' };

export const authApi = {
  me: () => http.get('/auth/me', { skipAuthEvent: true }).then(unwrap),
  login: (body) => http.post('/auth/login', body, { skipAuthEvent: true }).then(unwrap),
  logout: () => http.post('/auth/logout', {}, { skipAuthEvent: true }).then(unwrap),
  updateProfile: (body) => send('patch', '/auth/profile', body),
  changePassword: (body) => send('patch', '/auth/password', body),
};

export const siteApi = {
  bootstrap: () => get('/site'),
  saveSettings: (payload, files, onProgress) => upload('put', '/site-settings', payload, files, onProgress),
  saveBusiness: (body) => send('put', '/business', body),
  saveHours: (body) => send('put', '/opening-hours', body),
};

export const contentApi = {
  home: () => get('/home'),
  hero: (pageKey) => get(`/heroes/${pageKey}`),
  saveHero: (pageKey, payload, files, onProgress) => upload('put', `/heroes/${pageKey}`, payload, files, onProgress),
  about: () => get('/about'),
  saveAbout: (payload, files, onProgress) => upload('put', '/about', payload, files, onProgress),
  sections: () => get('/home-sections'),
  saveSection: (key, body) => send('put', `/home-sections/${key}`, body),
  reorderSections: (keys) => send('patch', '/home-sections/reorder', { keys }),
  addImage: (key, payload, file, onProgress) => upload('post', `/home-sections/${key}/images`, payload, { image: file }, onProgress),
  updateImage: (key, id, payload, file, onProgress) => upload('put', `/home-sections/${key}/images/${id}`, payload, { image: file }, onProgress),
  deleteImage: (key, id) => send('delete', `/home-sections/${key}/images/${id}`),
  setImageVideo: (key, id, file, onProgress) => upload('put', `/home-sections/${key}/images/${id}/video`, {}, { video: file }, onProgress),
  deleteImageVideo: (key, id) => send('delete', `/home-sections/${key}/images/${id}/video`),
  reorderImages: (key, ids) => send('patch', `/home-sections/${key}/images/reorder`, { ids }),
  setVideo: (key, file, onProgress) => upload('put', `/home-sections/${key}/video`, {}, { video: file }, onProgress),
  deleteVideo: (key) => send('delete', `/home-sections/${key}/video`),
};

export const menuApi = {
  items: (params) => page('/menu', params),
  adminItems: (params) => page('/menu', { ...params, ...admin }),
  saveItem: (id, payload, file, onProgress) => upload(id ? 'put' : 'post', id ? `/menu/${id}` : '/menu', payload, { image: file }, onProgress),
  patchItem: (id, body) => send('patch', `/menu/${id}`, body),
  deleteItem: (id) => send('delete', `/menu/${id}`),
  categories: () => get('/menu-categories'),
  adminCategories: () => get('/menu-categories', admin),
  saveCategory: (id, body) => send(id ? 'put' : 'post', id ? `/menu-categories/${id}` : '/menu-categories', body),
  reorderCategories: (ids) => send('patch', '/menu-categories/reorder', { ids }),
  deleteCategory: (id, params) => http.delete(`/menu-categories/${id}`, { params }).then(unwrap),
  documents: () => get('/menu-documents'),
  adminDocuments: () => get('/menu-documents', admin),
  saveDocument: (id, payload, files, onProgress) => upload(id ? 'put' : 'post', id ? `/menu-documents/${id}` : '/menu-documents', payload, files, onProgress),
  reorderDocuments: (ids) => send('patch', '/menu-documents/reorder', { ids }),
  deleteDocument: (id) => send('delete', `/menu-documents/${id}`),
};

export const galleryApi = {
  list: (params) => page('/gallery', params),
  adminList: (params) => page('/gallery', { ...params, ...admin }),
  save: (id, payload, file, onProgress) => upload(id ? 'put' : 'post', id ? `/gallery/${id}` : '/gallery', payload, { image: file }, onProgress),
  patch: (id, body) => send('patch', `/gallery/${id}`, body),
  remove: (id) => send('delete', `/gallery/${id}`),
};

export const reviewApi = {
  list: (params) => get('/reviews', params),
  adminList: () => get('/reviews', admin),
  save: (id, body) => send(id ? 'put' : 'post', id ? `/reviews/${id}` : '/reviews', body),
  patch: (id, body) => send('patch', `/reviews/${id}`, body),
  reorder: (ids) => send('patch', '/reviews/reorder', { ids }),
  remove: (id) => send('delete', `/reviews/${id}`),
};

export const enquiryApi = {
  submit: (body) => send('post', '/enquiries', body),
  list: (params) => page('/enquiries', params),
  patch: (id, body) => send('patch', `/enquiries/${id}`, body),
  remove: (id) => send('delete', `/enquiries/${id}`),
};

export const visitApi = {
  record: (path) => send('post', '/visits', { path }),
};

export const dashboardApi = { overview: () => get('/dashboard') };
