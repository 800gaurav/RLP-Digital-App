import { router } from 'expo-router';

let rootNavigationReady = false;
let pendingNavigation = null;

function runNavigation(action) {
  if (action.type === 'replace') {
    router.replace(action.href);
    return;
  }

  router.push(action.href);
}

function flushPendingNavigation() {
  if (!rootNavigationReady || !pendingNavigation) return;
  const action = pendingNavigation;
  pendingNavigation = null;
  runNavigation(action);
}

export function setRootNavigationReady(isReady) {
  rootNavigationReady = isReady;
  flushPendingNavigation();
}

export function isRootNavigationReady() {
  return rootNavigationReady;
}

export function safeReplace(href) {
  if (!rootNavigationReady) {
    pendingNavigation = { type: 'replace', href };
    return false;
  }

  router.replace(href);
  return true;
}

export function safePush(href) {
  if (!rootNavigationReady) {
    pendingNavigation = { type: 'push', href };
    return false;
  }

  router.push(href);
  return true;
}
