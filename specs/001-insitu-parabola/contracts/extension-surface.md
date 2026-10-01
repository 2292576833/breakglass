# Contract: Extension Surface

**Status**: P0 扩展表面  
**Form**: Chrome MV3 未打包扩展

## Manifest

| 项 | P0 值 |
| --- | --- |
| manifest_version | 3 |
| background | module service worker，无网络、无密钥 |
| action | 打开扩展内演示页 |
| permissions | 空 |
| host_permissions | 空 |
| content_scripts | 不声明。外部域名写入团队验证记录之前不注入 |
| content_security_policy.extension_pages | `script-src 'self'; object-src 'self'` |
| web_accessible_resources | 不向任意网页暴露脚本 |

不加入 `wasm-unsafe-eval`。不从网络加载脚本、样式或求值器。

## 演示页

- 页面内含一个 `<video>`，源为扩展包内文件。
- 视频 CSS 使用 `object-fit: contain` 与 `object-position: 50% 50%`。
- 页面提供播放、暂停、定位到目标时间、可见的破壁按钮、重置、退出和来源说明。
- Alt+B 触发破壁。Esc 退出。空格不作为破壁键。
- 覆盖层是视频上方的独立透明层，不替换视频源，不改写浏览器自带控件以外的宿主页面。演示页本身就是已验证页面，没有第三方播放器。

## 生命周期

- 退出、取消、播放或离开目标时间时，移除覆盖层和本次监听。
- service worker 不保存帧、曲线或密钥。
- 同一时刻只有一个交互会话。

## 明确不做

- 不请求任意网站权限。
- 不上传帧。
- 不包含 FastAPI 或其他服务。
- 不加载 Pyodide。
