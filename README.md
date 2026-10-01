BreakGlass（破壁）产品需求文档（PRD）

一、文档概述

项目名称：BreakGlass（破壁）
版本代号：v0.1.0-alpha（Hackathon 48h MVP）
一句话定义：基于浏览器注入图层与端侧 WASM 运行时的“只读视频原位像素逆向活化系统”
核心 Slogan：砸碎视频的只读玻璃，让屏幕里的死像素变成可触碰的活程序
产品形态：Chrome Extension（Manifest V3 规范扩展程序）

二、核心痛点与价值主张

2.1 目标用户画像

核心用户：
依靠 Bilibili、网课平台、高校 MOOC 自学编程与理科高阶知识的学生与开发者。

痛点场景：
视频中展示的代码/函数图像仅为画面像素，无法复制、无法局部微调参数观察变化；本地复现需配置运行环境、手动抄录，操作摩擦力极高。
结果：90% 的自学停留在“假装听懂”阶段。

2.2 核心价值

零侵入性（Zero-Intrusion）
无需视频平台提供 API，无需创作者做任何格式适配，通杀任意 HTML5 网页播放器。

原位活化（In-situ Overlay）
不弹窗、不跳转、不分屏，直接在视频当前画面的对应像素坐标处“唤醒”交互组件。

确定性执行（Zero Hallucination）
视觉模型仅用于结构定位与字符提取，代码执行与数学公式运算 100% 运行在端侧确定性沙盒内。

三、48h MVP 功能范围与场景定义

为确保 48 小时内高完成度交付，严格收敛为两个高频垂直场景，不做发散：


场景 A：数理函数控件
• 类型：一元二次/三次方程
• 动作：原位控制点拖拽
• 引擎：SVG / Canvas 重绘


3.3 明确不做的功能（Out of Scope）

• 暂不支持非固定机位、剧烈晃动的手机手持实拍视频（仅支持录屏、固定机位网课课件）。
• 暂不上传用户修改后的视频至云端（纯本地临时交互）。
• 暂不支持三维模型/复杂物理仿真的全局逆向。
暂不支持代码

四、系统技术架构与工作流水线

用户在任意网页暂停视频
↓ 按下空格或点击插件图标
Content Script 坐标与几何探测
• 捕获 HTML5 <video> DOM 节点
• 计算 Letterbox 黑边与实际视频画面映射比（Scale / Offset）
• 使用 Canvas 截取当前视频帧图像（DataURL / Blob）

↓
多模态感知层（Vision API，JSON 约束）
• 判定类型：Code / Function_Plot
• 提取区域坐标：box_2d [ymin, xmin, ymax, xmax]
• 提取结构数据：代码文本 / 代数方程参数

↓
原位图层挂载（Overlay Layer）
• 在 <video> 父容器注入绝对定位的透明交互容器（z-index: 999999）
• 播放 CSS3 玻璃微光撕裂动画

分支：


函数分支
• 挂载 SVG 矢量画布
• 监听手柄 MouseEvent 拖拽
• 实时根据参数方程重算 Path

4.1 几何坐标转换算法（解决黑边与缩放问题）

由于 <video> 容器的宽高比与视频源真实分辨率（videoWidth, videoHeight）往往不一致，浏览器会自动产生上下或左右黑边（Letterboxing / Pillarboxing）。

对齐计算公式（JavaScript）：

function getVideoRenderRect(video) {
const containerWidth = video.clientWidth;
const containerHeight = video.clientHeight;
const videoRatio = video.videoWidth / video.videoHeight;
const containerRatio = containerWidth / containerHeight;
let renderWidth, renderHeight, offsetX, offsetY;

if (containerRatio > videoRatio) {
// 左右有黑边 (Pillarbox)
renderHeight = containerHeight;
renderWidth = containerHeight * videoRatio;
offsetX = (containerWidth - renderWidth) / 2;
offsetY = 0;
} else {
// 上下有黑边 (Letterbox)
renderWidth = containerWidth;
renderHeight = containerWidth / videoRatio;
offsetX = 0;
offsetY = (containerHeight - renderHeight) / 2;
}

return { renderWidth, renderHeight, offsetX, offsetY };
}

绝对定位逻辑：
识别出的 box_2d（归一化坐标 0～1000）乘以 renderWidth 与 renderHeight，加上 offsetX 与 offsetY，确保生成的浮动层与视频像素重合。

五、数据协议与接口定义

5.1 感知层 API 输出协议（严格 JSON Schema）

调用 Vision API 时，强制启用结构化输出，确保返回的数据可直接被前端状态机消费：

{
"status": "success",
"scene_type": "code",
"target_box": {
"ymin": 140,
"xmin": 210,
"ymax": 620,
"xmax": 850
},
"code_payload": {
"language": "python",
"source_code": "def quick_sort(arr):\n if len(arr) <= 1: return arr\n pivot = arr[len(arr) // 2]\n left = [x for x in arr if x < pivot]\n middle = [x for x in arr if x == pivot]\n right = [x for x in arr if x > pivot]\n return quick_sort(left) + middle + quick_sort(right)\n\nprint(quick_sort([3, 6, 8, 10, 1, 2, 1]))",
"output_box": {
"ymin": 650,
"xmin": 210,
"ymax": 820,
"xmax": 850
}
},
"math_payload": {
"equation_type": "quadratic",
"formula_latex": "y = ax^2 + bx + c",
"parameters": { "a": -0.5, "b": 2.0, "c": 1.0 },
"domain": [-10, 10],
"range": [-5, 15]
}
}

注释：scene_type 可为 "code" / "math_plot" / "unsupported"。

六、用户体验与交互状态机

[State: IDLE]
监听快捷键（Alt + B）或点击悬浮胶囊

↓
[State: CAPTURING]（100ms）
video.pause() → Canvas 抓帧 → 屏幕边缘闪烁扫描光效

↓
[State: PARSING]（500ms～1200ms）
请求 Vision API（本地预热则读内存缓存）

↓
[State: ACTIVE_OVERLAY]（原位活化）
• 代码场景：光标直接聚焦到原代码区，回车即执行
• 图表场景：曲线显示呼吸蓝光，控制点可被平滑拖动

↓
[State: DISMISS]
用户按下 ESC 键或点击外部区域 → 销毁覆盖层 → 恢复视频播放

视觉还原度规范

编辑器背景：
提取原视频代码区域的背景色，以 rgba(r, g, b, 0.85) 填充，辅以 backdrop-filter: blur(4px)，既能遮挡底层的死像素，又保留与视频画面的融合感。

字体对齐：
采用 JetBrains Mono, Menlo, monospace，字号根据计算出的 target_box 高度与代码行数动态线性插值，使代码字符重叠度最优。

七、48 小时敏捷开发与排期看板

0h～6h：基础骨架
交付物：Chrome 扩展 Content Script 跑通；实现对任意网页 <video> 的定位、暂停与截帧提取。
责任焦点：跑通黑边坐标转换算法。

6h～14h：感知打通
交付物：接入 Vision API，配置结构化 Prompt；完成截图上传与 JSON 坐标回显测试。
责任焦点：调试输出稳定性与速度。

14h～24h：双引擎集成
交付物：搭建 SVG 动态函数曲线拖拽组件。
责任焦点：确保纯前端本地执行无阻断。

24h～34h：原位几何对齐
交付物：将解析数据与视频像素 1:1 锚定；实现半透明编辑器与动态控制点的平滑渲染。
责任焦点：解决不同屏幕缩放下的视觉误差。

34h～40h：魔法动效包装
交付物：增加玻璃破裂声效、荧光边框扫描粒子、ESC 退出过渡动画。
责任焦点：强化现场演示的视觉冲击力。

40h～48h：全真彩排与防翻车
交付物：固化 2 个演示 Demo（数学抛物线视频，物理）；录制预热缓存；演练 60s 脚本。
责任焦点：确保网络不可用时 100% 降级成功。


8.2 防翻车协议（Fallback Mechanism）

断网防线（Network Immunity）
• 在插件配置中内置 enableLocalMock: true 开关。
• 针对演练选定的两个演示 URL，提前在本地将 API 返回结果以静态 JSON 形式注入缓存。
• 现场只要检测到 API 响应时间超过 1.5 秒，自动走缓存管线，保证高潮环节 0.1 秒瞬发，杜绝礼堂 Wi-Fi 翻车事故。

环境安全（Safe Sandbox）
• Pyodide 运行在 Web Worker 内，限制单次执行超时时间为 3 秒，防止死循环导致整个浏览器页面卡死。

BreakGlass（破壁） · v0.1.0-alpha · Hackathon 48h MVP
砸碎视频的只读玻璃，让屏幕里的死像素变成可触碰的活程序

