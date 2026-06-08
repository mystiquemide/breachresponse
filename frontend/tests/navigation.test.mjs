import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DASHBOARD_PATH,
  HISTORY_PATH,
  LANDING_DISCONNECTED_PATH,
  PIPELINE_EXECUTION_ANCHOR,
  PIPELINE_EXECUTION_PATH,
  clearCommandCenterNavigationState,
  navigateToAppPath,
  leaveCommandCenter,
} from '../src/lib/navigation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

assert.equal(LANDING_DISCONNECTED_PATH, '/');
assert.equal(DASHBOARD_PATH, '/dashboard');
assert.equal(HISTORY_PATH, '/history');
assert.equal(PIPELINE_EXECUTION_ANCHOR, 'pipeline-execution');
assert.equal(PIPELINE_EXECUTION_PATH, '#pipeline-execution');

const landingSource = readFileSync(join(__dirname, '../src/app/page.tsx'), 'utf8');
assert.match(landingSource, /href=\{PIPELINE_EXECUTION_PATH\}/);
assert.match(landingSource, /id=\{PIPELINE_EXECUTION_ANCHOR\}/);
assert.doesNotMatch(landingSource, /href="#features"/);

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
  const events = [];
  const storage = createMockStorage();

  await leaveCommandCenter({
    disconnectAsync: async () => {
      events.push('disconnect-start');
      await new Promise((resolve) => setTimeout(resolve, 0));
      events.push('disconnect-complete');
    },
    location,
    storage,
  });

  assert.deepEqual(events, ['disconnect-start', 'disconnect-complete']);
  assert.deepEqual(storage.removed, [
    'breachresponse_launching_command_center',
    'breachresponse_return_to_command_center',
  ]);
  assert.deepEqual(location.calls, [['replace', LANDING_DISCONNECTED_PATH]]);
}

{
  const location = createMockLocation('/dashboard');
  let disconnected = false;
  const storage = createMockStorage();

  await leaveCommandCenter({
    disconnect: () => {
      disconnected = true;
    },
    location,
    storage,
  });

  assert.equal(disconnected, true);
  assert.deepEqual(location.calls, [['replace', LANDING_DISCONNECTED_PATH]]);
}

{
  const location = createMockLocation('/history');
  const storage = createMockStorage();

  await leaveCommandCenter({ location, storage });

  assert.deepEqual(location.calls, [['replace', LANDING_DISCONNECTED_PATH]]);
}
