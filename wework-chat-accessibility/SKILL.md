---
name: wework-chat-accessibility
description: 通过 macOS Accessibility (AXUIElement) 自动化访问企业微信 (WeCom) 当前对话窗口，支持抓取从当前滚动位置向下（或向上）直到无法滚动的所有聊天内容，处理 CEF 虚拟列表渲染、反直觉滚动方向、边界判定与位置还原。
---

# WeCom Chat Accessibility (企业微信对话无障碍抓取)

通过 macOS 原生 Accessibility (AXUIElement) 接口与企业微信（WeComCEF 架构）进行交互，精确读取当前打开会话中的全部聊天记录（发送人、时间、正文、引用卡片等），并支持步进滚动抓取与位置还原。

## 适用场景

- 需要获取企业微信当前正在查看的聊天窗口记录。
- 需要从当前滚动位置向下抓取到最新消息，或向上抓取历史记录。
- 需要自动化监控或导出企微对话内容，且无需侵入企微内存或 Hook 网络包。

## 运行前准备

运行脚本的终端进程（Terminal、iTerm2、VSCode 等）必须在 **「系统设置」→「隐私与安全性」→「辅助功能」** 中已勾选授权。

## 快捷调用脚本

技能内封装了零外部依赖的原生 Swift 脚本：

```bash
# 1. 从当前滚动位置向下抓取到最末尾（默认方向，纯文本输出）
~/.agents/skills/wework-chat-accessibility/scripts/dump_chat.swift

# 2. 抓取并输出为 JSON 格式
~/.agents/skills/wework-chat-accessibility/scripts/dump_chat.swift --format json

# 3. 抓取完成后自动将滚动条还原回原浏览位置
~/.agents/skills/wework-chat-accessibility/scripts/dump_chat.swift --restore

# 4. 向上翻滚抓取历史消息
~/.agents/skills/wework-chat-accessibility/scripts/dump_chat.swift --direction up --restore
```

### CLI 参数速查

| 参数 | 简写 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `--direction` | `-d` | `down` | 滚动方向：`down`（向下看最新消息）或 `up`（向上看历史记录） |
| `--format` | `-f` | `text` | 输出格式：`text`（易读文本）或 `json`（结构化数据） |
| `--restore` | `-r` | `false` | 抓取完成后是否将滚动条还原回执行前的位置 |
| `--max-pages` | `-m` | `50` | 最大翻页次数限制 |
| `--all` | - | `false` | 不限制从当前视口开始，抓取内存中已加载的所有行 |

---

## 核心机制与架构避坑指南

### 1. 结构层级（CEF / Chromium）
- **窗口**：`AXWindow (WeCom)`
- **聊天滚动容器**：`AXScrollArea`（主界面右侧中央，宽度通常 > 400，高度 > 300）
- **消息列表**：`AXScrollArea` 内包含一个唯一的 `AXTable`
- **单行消息**：`AXTable` 下包含多个 `AXRow`（`subrole: AXTableRow`）
- **垂直滚动条**：`kAXVerticalScrollBarAttribute`，其属性 `kAXValueAttribute` 为 `0.0 ~ 1.0` 的浮点数

### 2. 坑点一：滚动方向反直觉 (Scroll Content vs Page)
在 Chromium/CEF 的 Accessibility 实现中，滚动动作是对**内容对象**本身施加的：
- **`AXScrollUpByPage`**：将内容向上推 $\rightarrow$ **视口向下滚动（查看最新消息）**。
- **`AXScrollDownByPage`**：将内容向下推 $\rightarrow$ **视口向上滚动（查看历史消息）**。
若在抓取最新消息时调用 `AXScrollDownByPage`，界面会反向往上翻。

### 3. 坑点二：虚拟列表（Virtual List）增量抓取
企业微信采用 CEF 虚拟列表，不在可视区域内的消息节点会被卸载，AX 树中不存在。
- **必须采用「读一屏 $\rightarrow$ 翻页 $\rightarrow$ 等待 $\rightarrow$ 去重合并」循环**。
- 每次翻页后必须保留 `300ms ~ 400ms` 的渲染等待时间（`usleep(350000)`），让 CEF 将新 DOM 节点同步至系统的 AX 服务。

### 4. 触底与停止条件
- **向下翻页触底**：滚动条 `kAXValueAttribute >= 0.995`，或连续 2 轮未提取到任何新消息。
- **向上翻页到顶**：滚动条 `kAXValueAttribute <= 0.005`，或连续 2 轮未提取到任何新消息。
