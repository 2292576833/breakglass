# Contract: RuntimeConfig

**Status**: 演示配置契约  
**File**: 扩展包内静态 JSON，不由用户在界面里改写成识别成功

## 形状

```json
{
  "enableLocalMock": true,
  "fallbackAfterMs": 1500,
  "presetKey": "demo-parabola",
  "prewarmed": true,
  "externalAttempt": "off"
}
```

## 规则

- `fallbackAfterMs` 在本功能中必须是 1500。不得为了等真实识别把它加长。
- `enableLocalMock: true` 只表示使用准备结果，界面仍须标明来源。
- `prewarmed: false` 或准备结果不匹配当前视频和时间时，超时和失败走可恢复错误，不能显示曲线。
- `externalAttempt` 取值：

| 值 | 行为 |
| --- | --- |
| off | 不发起外部尝试。匹配的准备结果立即进入交互 |
| hang | 外部尝试不返回。1.5 秒后若准备结果匹配，则超时回退 |
| invalid | 外部尝试返回非法结果。按失败处理；有匹配准备结果时也不把它显示成识别成功 |
| late | 1.5 秒后先回退，再到达一份结果。迟到结果丢弃 |

主路径验收使用 `off`。故事 2 分别使用 `hang`、`invalid` 和无匹配准备结果。取消在 `hang` 下验收。

本配置不包含密钥、上传地址或模型名称。
