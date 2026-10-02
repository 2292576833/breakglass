const test = require('node:test');
const assert = require('node:assert/strict');
const { SessionController } = require('../extension/src/session/session');

function result(requestId) {
  return {
    requestId,
    videoId: 'fixture-parabola',
    time: 12.5,
    frameSize: { width: 1920, height: 1080 },
    source: 'preset',
    fallback: null,
    definition: {
      equationId: 'fixture.parabola',
      parameters: {
        h: { initial: 0, min: -2, max: 2, step: 0.1 }
      },
      dragParameter: 'h',
      domain: { min: -4, max: 4 },
      range: { min: -4, max: 4 },
      yAxis: 'up',
      region: { x: 100, y: 80, width: 640, height: 360 }
    }
  };
}

function controller() {
  return new SessionController({
    videoId: 'fixture-parabola',
    targetTime: 12.5,
    frameSize: { width: 1920, height: 1080 }
  });
}

test('only wakes while paused at the target time', () => {
  const session = controller();
  assert.equal(session.beginWait({ paused: false, currentTime: 12.5 }).code, 'not_ready');
  assert.equal(session.beginWait({ paused: true, currentTime: 10 }).code, 'not_ready');
  assert.equal(session.beginWait({ paused: true, currentTime: 12.5 }).ok, true);
});

test('resolves, clamps the drag parameter and resets without leaving', () => {
  const session = controller();
  const pending = session.beginWait({ paused: true, currentTime: 12.5 });
  assert.equal(session.resolve(result(pending.requestId)).ok, true);
  assert.equal(session.updateParameter('h', 99).session.currentParameters.h, 2);
  assert.equal(session.reset().session.currentParameters.h, 0);
  assert.equal(session.getState().status, 'interactive');
});

test('old request results cannot replace a newer wait', () => {
  const session = controller();
  const first = session.beginWait({ paused: true, currentTime: 12.5 });
  const second = session.beginWait({ paused: true, currentTime: 12.5 });
  assert.equal(session.resolve(result(first.requestId)).ok, false);
  assert.equal(session.resolve(result(second.requestId)).ok, true);
});

test('exit clears the active session and returns to paused-ready', () => {
  const session = controller();
  const pending = session.beginWait({ paused: true, currentTime: 12.5 });
  session.resolve(result(pending.requestId));
  assert.equal(session.exit().status, 'paused-ready');
  assert.equal(session.getState().result, null);
});
