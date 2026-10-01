(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BreakGlass = root.BreakGlass || {};
  root.BreakGlass.evaluate = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const evaluators = {
    'fixture.parabola': ({ a, h, k }, x) => a * (x - h) * (x - h) + k
  };

  function evaluateCurve(definition, x) {
    if (!definition || !Object.prototype.hasOwnProperty.call(evaluators, definition.equationId)) {
      throw new Error(`未知 equationId: ${definition && definition.equationId}`);
    }
    if (!Number.isFinite(x)) throw new TypeError('x 必须是有限数值。');
    const parameters = Object.fromEntries(
      Object.entries(definition.parameters).map(([name, value]) => [name, value.initial ?? value])
    );
    return evaluators[definition.equationId](parameters, x);
  }

  function evaluateWithParameters(definition, parameters, x) {
    if (!definition || !Object.prototype.hasOwnProperty.call(evaluators, definition.equationId)) {
      throw new Error(`未知 equationId: ${definition && definition.equationId}`);
    }
    if (!Number.isFinite(x)) throw new TypeError('x 必须是有限数值。');
    return evaluators[definition.equationId](parameters, x);
  }

  return { evaluators, evaluateCurve, evaluateWithParameters };
});
