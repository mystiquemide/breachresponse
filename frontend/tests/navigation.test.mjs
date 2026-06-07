import assert from 'node:assert/strict';
import {
  DASHBOARD_PATH,
  HISTORY_PATH,
  LANDING_DISCONNECTED_PATH,
  clearCommandCenterNavigationState,
  navigateToAppPath,
  leaveCommandCenter,
} from '../src/lib/navigation.js';

function createMockLocation(pathname = '/dashboard') {
  const calls = [];
  return {
    pathname,
    href: `https://example.test${pathname}`,
    calls,
    assign(target) {
      calls.push(['assign', target]);
      this.href = target;
      this.pathname = new URL(target, 'https://example.test').pathname;
    },
    replace(target) {
      calls.push(['replace', target]);
      this.href = target;
      this.pathname = new URL(target, 'https://example.test').pathname;
    },
  };
}

function createMockStorage() {
  const removed = [];
  return {
    removed,
    removeItem(key) {
      removed.push(key);
    },
  };
}

assert.equal(LANDING_DISCONNECTED_PATH, '/?wallet=disconnected');
assert.equal(DASHBOARD_PATH, '/dashboard');
assert.equal(HISTORY_PATH, '/history');

{
  const storage = createMockStorage();
  clearCommandCenterNavigationState(storage);
  assert.deepEqual(storage.removed, [
    'breachresponse_launching_command_center',
    'breachresponse_return_to_command_center',
  ]);
}

{
  const location = createMockLocation('/dashboard');
  navigateToAppPath(location, '/history');
  assert.deepEqual(location.calls, [['assign', '/history']]);
}

{
  const location = createMockLocation('/dashboard');
  let disconnected = false;
  const storage = createMockStorage();

  leaveCommandCenter({
    disconnect: () => {
      disconnected = true;
    },
    location,
    storage,
  });

  assert.equal(disconnected, true);
  assert.deepEqual(storage.removed, [
    'breachresponse_launching_command_center',
    'breachresponse_return_to_command_center',
  ]);
  assert.deepEqual(location.calls, [['replace', LANDING_DISCONNECTED_PATH]]);
}

{
  const location = createMockLocation('/history');
  const storage = createMockStorage();

  leaveCommandCenter({ location, storage });

  assert.deepEqual(location.calls, [['replace', LANDING_DISCONNECTED_PATH]]);
}
