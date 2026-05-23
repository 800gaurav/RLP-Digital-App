import { apiClient } from './api';
import { demoAdminStats, demoOfficials, demoSubscription, demoUser } from './mockData';

export async function getAdminOverview() {
  try {
    const response = await apiClient.get('/admin/overview');
    return response.data.data;
  } catch (error) {
    // TODO: Add /admin/overview for mobile admin dashboard metrics.
    if (!error.response) return demoAdminStats;
    throw error;
  }
}

export async function getAdminUsers() {
  try {
    const response = await apiClient.get('/admin/users');
    return response.data.data;
  } catch (error) {
    // TODO: Add paginated admin user management endpoint with permission flags.
    if (!error.response) {
      return [
        demoUser,
        { ...demoUser, id: 'rlp-member-2', fullName: 'Sita Devi', email: 'sita@example.com', role: 'user', stampPadAccess: false, subscriptionStatus: 'inactive' },
        { ...demoUser, id: 'rlp-member-3', fullName: 'Ramesh Kumar', email: 'ramesh@example.com', role: 'user', stampPadAccess: true, subscriptionStatus: 'active' },
      ];
    }
    throw error;
  }
}

export async function getAdminContentSummary() {
  try {
    const response = await apiClient.get('/admin/content-summary');
    return response.data.data;
  } catch (error) {
    // TODO: Back this with reels, notifications, padadhikari, and pricing management endpoints.
    if (!error.response) {
      return {
        officials: demoOfficials.length,
        subscriptionPrice: demoSubscription.price,
        pendingUploads: 4,
      };
    }
    throw error;
  }
}

export async function updateAdminUserPermissions(id, data) {
  const response = await apiClient.patch(`/admin/users/${id}/permissions`, data);
  return response.data.data;
}

export async function createBroadcastNotification(data) {
  const response = await apiClient.post('/notifications', data);
  return response.data.data;
}

export async function getNotifications() {
  const response = await apiClient.get('/notifications');
  return response.data.data;
}

export async function updateNotification(id, data) {
  const response = await apiClient.put(`/notifications/${id}`, data);
  return response.data.data;
}

export async function deleteNotification(id) {
  const response = await apiClient.delete(`/notifications/${id}`);
  return response.data;
}

export async function updateSubscriptionPrice(price) {
  const response = await apiClient.put('/admin/subscriptions/price', { price });
  return response.data.data;
}
