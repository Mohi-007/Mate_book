import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://matebookweb.vercel.app/api';
export const API_BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => {
    if (data instanceof FormData) {
      return api.put('/auth/profile', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put('/auth/profile', data);
  },
  updateMood: (mood) => api.put('/auth/mood', { mood }),
  getMoodHistory: (userId) => api.get('/auth/mood-history', { params: { user_id: userId } }),
  getUser: (id) => api.get(`/auth/users/${id}`),
  searchUsers: (q) => api.get('/auth/users/search', { params: { q } }),
};

// ── Posts ──
export const postsAPI = {
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/posts', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/posts', data);
  },
  getFeed: (page) => api.get('/posts/feed', { params: { page } }),
  getUserPosts: (userId, page) => api.get(`/posts/user/${userId}`, { params: { page } }),
  getTrending: () => api.get('/posts/trending'),
  toggleLike: (postId) => api.post(`/posts/${postId}/like`),
  addComment: (postId, content) => api.post(`/posts/${postId}/comment`, { content }),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  sharePost: (postId) => api.post(`/posts/${postId}/share`),
  toggleSave: (postId) => api.post(`/posts/${postId}/save`),
  getSaved: () => api.get('/posts/saved'),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  getMemories: () => api.get('/posts/memories'),
};

// ── Chat ──
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (data) => api.post('/chat/conversations', data),
  getMessages: (convId, page) => api.get(`/chat/conversations/${convId}/messages`, { params: { page } }),
  sendMessage: (convId, data) => api.post(`/chat/conversations/${convId}/messages`, data),
  markSeen: (msgId) => api.post(`/chat/messages/${msgId}/seen`),
};

// ── Stories ──
export const storiesAPI = {
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/stories', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/stories', data);
  },
  getFeed: () => api.get('/stories/feed'),
  viewStory: (storyId) => api.post(`/stories/${storyId}/view`),
  reactToStory: (storyId, emoji) => api.post(`/stories/${storyId}/react`, { emoji }),
  getViewers: (storyId) => api.get(`/stories/${storyId}/viewers`),
};

// ── Friends ──
export const friendsAPI = {
  sendRequest: (userId) => api.post('/friends/request', { user_id: userId }),
  acceptRequest: (friendshipId) => api.post(`/friends/accept/${friendshipId}`),
  declineRequest: (friendshipId) => api.post(`/friends/decline/${friendshipId}`),
  getFriends: (userId) => api.get('/friends', { params: { user_id: userId } }),
  getPendingRequests: () => api.get('/friends/requests'),
  unfriend: (userId) => api.delete(`/friends/unfriend/${userId}`),
  getStatus: (userId) => api.get(`/friends/status/${userId}`),
};

// ── News ──
export const newsAPI = {
  getNews: (category) => api.get('/news', { params: { category } }),
};

// ── Features ──
export const featuresAPI = {
  getChallenges: () => api.get('/features/challenges'),
  createChallenge: (data) => api.post('/features/challenges', data),
  enterChallenge: (challengeId, data) => api.post(`/features/challenges/${challengeId}/enter`, data),
  getChallengeEntries: (challengeId) => api.get(`/features/challenges/${challengeId}/entries`),
  getDebates: () => api.get('/features/debates'),
  createDebate: (data) => api.post('/features/debates', data),
  voteDebate: (debateId, option) => api.post(`/features/debates/${debateId}/vote`, { option }),
  commentDebate: (debateId, data) => api.post(`/features/debates/${debateId}/comment`, data),
  getDebateComments: (debateId) => api.get(`/features/debates/${debateId}/comments`),
  getAnalytics: (userId) => api.get('/features/analytics', { params: { user_id: userId } }),
};

// ── Admin ──
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (page) => api.get('/admin/users', { params: { page } }),
  toggleAdmin: (userId) => api.post(`/admin/users/${userId}/toggle-admin`),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  seedChallenges: () => api.post('/admin/seed'),
};

export default api;
