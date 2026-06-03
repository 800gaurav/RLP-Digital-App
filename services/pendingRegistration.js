let pendingRegistration = null;

export function setPendingRegistration(data) {
  pendingRegistration = data;
}

export function getPendingRegistration() {
  return pendingRegistration;
}

export function clearPendingRegistration() {
  pendingRegistration = null;
}
