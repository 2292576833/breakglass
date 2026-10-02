(function (root, factory) {
  const api = factory(root.BreakGlass || {});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BreakGlass = root.BreakGlass || {};
  root.BreakGlass.preset = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (BreakGlass) {
  const validate = BreakGlass.validate;

  async function loadJson(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`无法读取 ${path}（${response.status}）。`);
    return response.json();
  }

  async function loadPreset({ configPath = '../assets/config.json', presetBasePath = '../assets/presets/' } = {}) {
    const config = await loadJson(configPath);
    if (config.enableLocalMock !== true || config.prewarmed !== true) {
      return { ok: false, code: 'preset_disabled', message: '预制结果未启用或尚未预热。', config };
    }
    const result = await loadJson(`${presetBasePath}${config.presetKey}.json`);
    const check = validate.validateCurveResult(result);
    if (!check.ok) return { ok: false, code: check.code, message: check.message, config };
    return { ok: true, config, result: check.value };
  }

  return { loadJson, loadPreset };
});
