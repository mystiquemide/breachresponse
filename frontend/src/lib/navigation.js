export const LANDING_PATH = '/';
export const LANDING_DISCONNECTED_PATH = '/?wallet=disconnected';
export const DASHBOARD_PATH = '/dashboard';
export const HISTORY_PATH = '/history';

const COMMAND_CENTER_NAV_KEYS = [
  'breachresponse_launching_command_center',
  'breachresponse_return_to_command_center',
];

export function clearCommandCenterNavigationState(storage) {
  if (!storage) return;

  COMMAND_CENTER_NAV_KEYS.forEach((key) => {
    try {
      storage.removeItem(key);
    } catch {
      // Storage can be blocked in some wallet browsers. Navigation must still work.
    }
  });
}

export function navigateToAppPath(location, path) {
  if (!location) return;

  if (typeof location.assign === 'function') {
    location.assign(path);
    return;
  }

  location.href = path;
}

export function replaceWithAppPath(location, path) {
  if (!location) return;

  if (typeof location.replace === 'function') {
    location.replace(path);
    return;
  }

  location.href = path;
}

export function leaveCommandCenter({ disconnect, location, storage } = {}) {
  clearCommandCenterNavigationState(storage);

  if (typeof disconnect === 'function') {
    disconnect();
  }

  replaceWithAppPath(location, LANDING_DISCONNECTED_PATH);
}
