(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BreakGlass = root.BreakGlass || {};
  root.BreakGlass.geometry = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function parsePosition(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const token = String(value ?? '50%').trim().split(/\s+/)[0];
    if (token.endsWith('%')) return Number.parseFloat(token.slice(0, -1));
    if (token === 'left' || token === 'top') return 0;
    if (token === 'center') return 50;
    if (token === 'right' || token === 'bottom') return 100;
    return 50;
  }

  function getContentRect({ elementRect, videoWidth, videoHeight, objectFit = 'contain', objectPosition = '50% 50%' }) {
    if (!elementRect || !Number.isFinite(elementRect.left) || !Number.isFinite(elementRect.top) ||
        !Number.isFinite(elementRect.width) || !Number.isFinite(elementRect.height) ||
        elementRect.width <= 0 || elementRect.height <= 0 || videoWidth <= 0 || videoHeight <= 0) {
      return null;
    }
    if (objectFit !== 'contain') throw new Error(`P0 暂不支持 object-fit: ${objectFit}`);

    const scale = Math.min(elementRect.width / videoWidth, elementRect.height / videoHeight);
    const renderWidth = videoWidth * scale;
    const renderHeight = videoHeight * scale;
    const position = String(objectPosition).trim().split(/\s+/);
    const positionX = Math.max(0, Math.min(100, parsePosition(position[0])));
    const positionY = Math.max(0, Math.min(100, parsePosition(position[1] ?? position[0])));
    const offsetX = (elementRect.width - renderWidth) * positionX / 100;
    const offsetY = (elementRect.height - renderHeight) * positionY / 100;

    return {
      elementRect: { ...elementRect },
      contentRect: {
        left: elementRect.left + offsetX,
        top: elementRect.top + offsetY,
        width: renderWidth,
        height: renderHeight
      },
      objectFit,
      objectPosition,
      scale
    };
  }

  return { getContentRect };
});
