---
name: wework-developer-docs
description: >-
  Fetch and extract clean body text from WeCom (企业微信) developer docs at
  https://developer.work.weixin.qq.com/document/path/*. Use when the user links
  or cites a work.weixin.qq.com document path, asks for 企微/企业微信 API 文档内容
---

# WeCom Developer Docs

获取 `https://developer.work.weixin.qq.com/document/path/<id>` 页面的**正文**（去掉侧边栏导航噪音）。

## Workflow

1. 使用可用的web抓取工具抓取目标 URL（可只给 path id，补全为完整 URL）并把结果写为临时文件（通常数千行，大半是导航）。
2. 用本技能脚本抽出正文：

```bash
bash ~/.agents/skills/wework-developer-docs/scripts/extract-body.sh /path/to/webfetch-output.txt
```

4. 以脚本 stdout 作为文档依据回答或实现；不要通读原始整页。

## URL 规则

| 输入                                                          | 规范化                                                      |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `100087`                                                      | `https://developer.work.weixin.qq.com/document/path/100087` |
| `/document/path/100087`                                       | 同上                                                        |
| 完整 `https://developer.work.weixin.qq.com/document/path/...` | 原样使用                                                    |

仅处理该前缀的文档页；其它域名不要用本技能。

## 正文边界（脚本已封装）

企微文档页经抓取后的稳定标记：

- **标题**：文件第 1 行（`… - 文档 - 企业微信开发者中心`）
- **起点**：`最后更新：`
- **终点**：`上一篇`（不含该行）

若找不到上述标记，脚本非 0 退出；此时再人工检查原始文件或换浏览器打开。

## 注意

- 需要多篇文档时，对每个 URL 重复「Fetch → extract-body」；可并行 WebFetch，再分别过滤。
