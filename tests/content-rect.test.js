const test = require('node:test');
const assert = require('node:assert/strict');
const { getContentRect } = require('../extension/src/geometry/content-rect');

const elementRect = { left: 10, top: 20, width: 1200, height: 600 };

test('contain computes pillarbox content from source dimensions', () => {
  const result = getContentRect({
    elementRect,
    videoWidth: 1920,
    videoHeight: 1080,
    objectFit: 'contain',
    objectPosition: '50% 50%'
  });
  assert.equal(result.scale, 600 / 1080);
  assert.equal(result.contentRect.width, 1920 * (600 / 1080));
  assert.equal(result.contentRect.height, 600);
  assert.equal(result.contentRect.left, 10 + (1200 - result.contentRect.width) / 2);
});

test('contain computes letterbox content when the container is taller', () => {
  const result = getContentRect({
    elementRect: { left: 0, top: 0, width: 600, height: 1000 },
    videoWidth: 1920,
    videoHeight: 1080,
    objectFit: 'contain',
    objectPosition: '50% 50%'
  });
  assert.equal(result.contentRect.width, 600);
  assert.equal(result.contentRect.height, 600 / (1920 / 1080));
  assert.equal(result.contentRect.top, (1000 - result.contentRect.height) / 2);
});

test('invalid geometry returns null', () => {
  assert.equal(getContentRect({ elementRect, videoWidth: 0, videoHeight: 1080 }), null);
});
