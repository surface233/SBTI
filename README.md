# SBTI Local

本地静态复刻版 SBTI 风格娱乐人格测试。

## 使用方式

这是纯前端静态页面，所有题库、计算逻辑和图片都在本地文件里，不需要后端服务。

### 方式一：直接打开 HTML

可以直接双击：

```text
/Users/yunhao/data/demon/sbti-local/index.html
```

或者在 terminal 里运行：

```bash
open /Users/yunhao/data/demon/sbti-local/index.html
```

这种方式会使用 `file://` 打开页面。答题、计算、结果展示都可以正常使用。

注意：不同浏览器对 `file://` 页面有不同安全限制，`复制结果` 和 `localStorage` 这类浏览器能力可能表现不完全一致。

### 方式二：本地静态服务

```bash
python3 -m http.server 8018 --directory /Users/yunhao/data/demon/sbti-local
```

然后打开：

```text
http://localhost:8018/
```

这种方式不是后端计算，只是用 Python 把本地文件按 HTTP 静态资源方式提供出来。它更接近真实网站环境，适合调试、浏览器测试或以后部署前检查。

## 文件

- `index.html`: 页面结构和 SEO 基础信息
- `styles.css`: 响应式布局、视觉样式、动效
- `data.js`: 原站完整题库、人格文案、图片映射、人格 pattern
- `app.js`: 随机题序、进度、本地保存、结果计算
- `assets/images/`: 本地结果图资源

## 说明

测试结果完全在浏览器本地计算，答题进度保存在 `localStorage`，不会上传答案。
