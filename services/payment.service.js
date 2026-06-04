import apiClient from './api';
import { normalizeUserMedia } from './media';

export async function initiateRegistrationPayment(data) {
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  const response = await apiClient.post('/payments/upi/initiate-registration', payload, {
    skipGlobalErrorLog: true,
  });
  const result = response.data.data;
  return {
    ...result,
    user: result?.user ? normalizeUserMedia(result.user) : result?.user,
  };
}

export async function getRegistrationPaymentStatus(params) {
  const query = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  const response = await apiClient.get('/payments/upi/status', { params: query, skipGlobalErrorLog: true });
  const result = response.data.data;
  return {
    ...result,
    user: result?.user ? normalizeUserMedia(result.user) : result?.user,
  };
}
