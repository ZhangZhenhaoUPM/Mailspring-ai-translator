# Mailspring AI Translator (Gemini / Ollama)

Translate emails in Mailspring with Gemini (cloud) or Ollama (local).  
The plugin replaces the original content with the translated text, preserving basic HTML formatting.

---

## Features

- Translate email body in the message viewer
- Translate composer draft (optional replace)
- Provider switch: **Gemini** or **Ollama**
- Per‑message cache (in‑memory) to avoid repeated translations
- Settings UI inside the plugin (no dependence on global settings)
- Media elements (images/video/iframe) are stripped before sending to the model

---

## Installation

1. Build the plugin:

```bash
npm install
npm run build
```

2. Install into Mailspring:

- `Developer > Install a Plugin...` and choose this folder  
  **or**
- Copy/symlink this folder to:
  - macOS: `~/Library/Application Support/Mailspring/packages/`
  - Linux: `~/.config/Mailspring/packages/`
  - Windows: `%APPDATA%\\Mailspring\\packages\\`

3. Restart Mailspring (or reload the main window in DevTools).

---

## Usage

Open an email → click **Translate**.  
Click **Settings** to configure provider, model, and target language.

---

## Settings

### Provider: Gemini (cloud)

- **API Key**: get from Google AI Studio
- **Model**: choose from the dropdown or enter a custom model
- **Target Language**: language to translate into

### Provider: Ollama (local)

- **Ollama Host**: default `http://127.0.0.1:11434`
- **Ollama Model**: e.g. `qwen3`
- **Target Language**: language to translate into

---

## Cache

The plugin caches translations in memory during the current session.
Switching away and back to a message will show the cached translation immediately.

Limits:
- Max 50 cached messages
- Max 120000 characters per cached translation

---

## Troubleshooting

**Translation times out**
- Try a faster model (e.g. `gemini-2.5-flash-lite`)
- Reduce email size
- Check network to `generativelanguage.googleapis.com`

**Settings not saved**
- The plugin falls back to `localStorage` if `AppEnv.config` is not available

**Button not visible**
- Make sure `npm run build` has been run
- Restart Mailspring after install

---

## Uninstall

Delete the plugin folder from Mailspring’s `packages` directory and restart.

---

# Mailspring AI 翻译插件（Gemini / Ollama）

在 Mailspring 中使用 Gemini（云端）或 Ollama（本地）翻译邮件。  
翻译结果会替换原文内容并尽量保留 HTML 格式。

---

## 功能

- 邮件阅读视图一键翻译
- 写信界面翻译并可替换正文
- 支持 Gemini / Ollama 供应商切换
- 会话内缓存，避免重复翻译
- 插件内置设置面板，不依赖全局设置
- 自动移除图片/视频/iframe 等媒体内容

---

## 安装

1. 构建插件：

```bash
npm install
npm run build
```

2. 安装到 Mailspring：

- `Developer > Install a Plugin...` 选择本插件目录  
  **或**
- 复制/软链接到：
  - macOS: `~/Library/Application Support/Mailspring/packages/`
  - Linux: `~/.config/Mailspring/packages/`
  - Windows: `%APPDATA%\\Mailspring\\packages\\`

3. 重启 Mailspring（或在 DevTools 里 Reload 主窗口）。

---

## 使用

打开邮件 → 点击 **Translate**  
点击 **Settings** 配置供应商、模型和目标语言。

---

## 设置说明

### Gemini（云端）

- **API Key**：从 Google AI Studio 获取
- **Model**：下拉选择或自定义
- **Target Language**：目标语言

### Ollama（本地）

- **Ollama Host**：默认 `http://127.0.0.1:11434`
- **Ollama Model**：如 `qwen3`
- **Target Language**：目标语言

---

## 缓存

翻译结果仅缓存于**当前会话内**。切换邮件后返回会直接显示缓存结果。

限制：
- 最多缓存 50 封邮件
- 单条翻译最大 120000 字符

---

## 常见问题

**翻译超时**
- 使用更快模型（例如 `gemini-2.5-flash-lite`）
- 缩短邮件内容
- 检查到 `generativelanguage.googleapis.com` 的网络

**设置保存失败**
- 当 `AppEnv.config` 不可用时，会回退到 `localStorage`

**按钮不显示**
- 确认已执行 `npm run build`
- 安装后需重启 Mailspring

---

## 卸载

删除 `packages` 目录下的插件文件夹并重启。
