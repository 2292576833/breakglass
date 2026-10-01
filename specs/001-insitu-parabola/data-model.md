# Data Model: 原位抛物线破壁

字段约束与 `contracts/curve-result.md` 一致。本文件描述内存中的关系和状态，不表示服务端存储。

## DemoVideo

团队提供的一段录屏或固定机位课件。

| 字段 | 说明 |
| --- | --- |
| videoId | 稳定字符串，与准备结果对照 |
| title | 给人看的名称 |
| sourceUrl | 扩展包内地址 |
| duration | 秒，有限正数 |
| frameSize | 源像素宽高，来自视频元数据，不来自元素外框 |

关系：一个演示视频有一个验收用的目标时间，以及零份或一份与该时间匹配的准备结果。

## ParabolaDefinition

某个视频和目标时间上的抛物线。公式不写死在模型里。

| 字段 | 说明 |
| --- | --- |
| equationId | 求值器白名单中的 id |
| parameters | 具名参数。每个参数有 initial、min、max、step，且都是有限数值 |
| dragParameter | 控制点拖动所改变的参数名，必须存在于 parameters |
| domain | 数学横坐标闭区间 |
| range | 数学纵坐标闭区间 |
| yAxis | `up` 或 `down` |
| region | 曲线在源帧像素中的矩形：x、y、width、height |

校验：min ≤ initial ≤ max，step 为正，region 落在 frameSize 内，domain 与 range 的最小值小于最大值。未知 equationId 不得进入交互。

## CurveResult

一次可以被交互层消费的结果。准备结果和将来的识别结果共用这个形状。

| 字段 | 说明 |
| --- | --- |
| requestId | 本次唤醒的编号 |
| videoId | 必须等于当前视频 |
| time | 秒，必须落在目标时间容差内 |
| frameSize | 与当前视频源尺寸一致 |
| source | `preset` 或 `vision`。本功能验收只产生 `preset` |
| fallback | 无，或 `timeout`。超时回退仍是 `preset`，并保留原因 |
| definition | 一份 ParabolaDefinition |

校验失败、视频或时间不匹配、数值非有限时，结果不得进入交互。`source: vision` 在本功能中没有生产者；若夹具错误地标成 vision，校验必须拒绝或测试必须失败。

## RuntimeConfig

随扩展打包的静态配置，不是用户账号数据。

| 字段 | 说明 |
| --- | --- |
| enableLocalMock | 布尔值。演示配置为 true |
| fallbackAfterMs | 1500 |
| presetKey | 准备结果的键 |
| prewarmed | 准备结果是否已经随包可用 |
| externalAttempt | `off`、`hang`、`invalid`、`late`。默认 `off` |

`externalAttempt` 只用于故事 2 的演练，不是识别服务。正式主路径保持 `off`。

## ContentRect

由视频元素实时算出的值对象，不写入准备结果。

| 字段 | 说明 |
| --- | --- |
| elementRect | 元素在页面上的边框 |
| contentRect | 去掉黑边后的画面矩形 |
| objectFit | P0 验收使用 `contain` |
| objectPosition | 默认 `50% 50%` |
| scale | 源像素到 CSS 像素的比例 |

窗口、全屏或设备像素比变化后丢弃旧值并重算。鼠标位置先落到 contentRect，再换成源像素，再换成数学坐标。

## InteractionSession

当前覆盖层。同一时刻最多一个。

| 字段 | 说明 |
| --- | --- |
| requestId | 绑定的结果编号 |
| status | 见下方状态 |
| definition | 进入交互后的抛物线定义 |
| currentParameters | 可被拖动修改的当前值 |
| initialParameters | 重置所用的初值 |
| sourceLabel | 用户可见来源，准备结果不得写成识别成功 |
| fallbackReason | 超时回退时持续可见 |

### 状态

```text
playing / away-from-target
  -> paused-ready          暂停且时间落在目标容差内

paused-ready
  -> waiting               用户唤醒
  -> playing               用户播放

waiting
  -> interactive           匹配的准备结果可用，或超时后匹配
  -> recoverable-error     无匹配准备结果，或结果非法
  -> paused-ready          用户取消；此后该 requestId 的结果作废

interactive
  -> interactive           拖动或重置
  -> paused-ready          退出、Esc、点击外部
  -> playing               视频开始播放或离开目标时间；覆盖层必须先移除
```

进入 `interactive` 时记录初始参数。重置只改 `currentParameters`。退出、取消、播放和离开目标帧都移除覆盖层、监听和消息，且不得留下第二个覆盖层。

较早 requestId 的结果不能写入当前会话。视频 id 或时间已经变化时，旧结果直接丢弃。
