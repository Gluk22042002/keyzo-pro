const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (username, email, password, role) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password, role }) }),
  getCategories: () => request('/categories'),
  getProducts: (params) => request(`/products?${new URLSearchParams(params)}`),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  addReview: (id, rating, comment) => request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) }),
  getCart: () => request('/cart'),
  getCartCount: () => request('/cart/count'),
  addToCart: (product_id) => request('/cart', { method: 'POST', body: JSON.stringify({ product_id }) }),
  removeFromCart: (productId) => request(`/cart/${productId}`, { method: 'DELETE' }),
  getFavorites: () => request('/favorites'),
  toggleFavorite: (product_id) => request('/favorites', { method: 'POST', body: JSON.stringify({ product_id }) }),
  validatePromo: (code, order_amount) => request('/promo/validate', { method: 'POST', body: JSON.stringify({ code, order_amount }) }),
  createOrder: (product_id, promo_code) => request('/orders', { method: 'POST', body: JSON.stringify({ product_id, promo_code }) }),
  confirmOrder: (id, action) => request(`/orders/${id}/confirm`, { method: 'POST', body: JSON.stringify({ action }) }),
  getOrders: () => request('/orders'),
  getSellerOrders: () => request('/orders/seller'),
  getSeller: (id) => request(`/sellers/${id}`),
  getSellerDashboard: () => request('/seller/dashboard'),
  getSellerAnalytics: (days) => request(`/seller/analytics?days=${days || 30}`),
  getBalance: () => request('/user/balance'),
  addBalance: (amount) => request('/user/balance', { method: 'POST', body: JSON.stringify({ amount }) }),
  updateProfile: (data) => request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getMessages: () => request('/messages'),
  getThread: (userId) => request(`/messages/${userId}`),
  sendMessage: (receiver_id, text) => request('/messages', { method: 'POST', body: JSON.stringify({ receiver_id, text }) }),
  getUnreadCount: () => request('/messages/unread/count'),
  getNotifications: () => request('/notifications'),
  getNotificationsUnread: () => request('/notifications/unread'),
  markNotificationsRead: () => request('/notifications/read', { method: 'POST' }),
  uploadFile: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  setup2FA: () => request('/2fa/setup', { method: 'POST' }),
  verify2FA: (code) => request('/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) }),
  disable2FA: () => request('/2fa/disable', { method: 'POST' }),
  getReferral: () => request('/referrals/my'),
  applyReferral: (code) => request('/referrals/apply', { method: 'POST', body: JSON.stringify({ code }) }),
  getLoyalty: () => request('/loyalty/balance'),
  redeemLoyalty: (points) => request('/loyalty/redeem', { method: 'POST', body: JSON.stringify({ points }) }),
  createDispute: (orderId, reason, evidence) => request(`/orders/${orderId}/dispute`, { method: 'POST', body: JSON.stringify({ reason, evidence }) }),
  adminStats: () => request('/admin/stats'),
  adminUsers: () => request('/admin/users'),
  adminUpdateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminProducts: () => request('/admin/products'),
  adminOrders: () => request('/admin/orders'),
  adminDisputes: () => request('/admin/disputes'),
  adminPromos: () => request('/admin/promos'),
  adminCreatePromo: (data) => request('/admin/promos', { method: 'POST', body: JSON.stringify(data) }),
  adminResolveDispute: (id, data) => request(`/orders/${id}/confirm`, { method: 'POST', body: JSON.stringify({ action: 'refund', ...data }) }),
  getSettings: () => request('/settings'),
  getUserSettings: () => request('/user/settings'),
  getUserStats: () => request('/user/stats'),
  changePassword: (currentPassword, newPassword) => request('/user/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),
  updateNotificationPrefs: (prefs) => request('/user/notifications', { method: 'PUT', body: JSON.stringify(prefs) }),
  uploadAvatar: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/user/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },
  deleteAccount: () => request('/user/account', { method: 'DELETE' }),
};
