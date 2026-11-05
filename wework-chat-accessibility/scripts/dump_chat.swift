#!/usr/bin/env swift
import Cocoa
import ApplicationServices

// MARK: - 数据模型
struct ChatMessage: Codable, Equatable, Hashable {
    let index: Int
    let sender: String
    let time: String
    let content: String
    
    var identifier: String {
        return "\(sender)|\(time)|\(content)"
    }
}

struct OutputPayload: Codable {
    let initialScrollValue: Double
    let finalScrollValue: Double
    let direction: String
    let restored: Bool
    let totalMessages: Int
    let messages: [ChatMessage]
}

// MARK: - 辅助函数
func getElementRect(_ el: AXUIElement) -> CGRect {
    var ptVal: AnyObject?, szVal: AnyObject?
    var pt = CGPoint.zero, sz = CGSize.zero
    if AXUIElementCopyAttributeValue(el, kAXPositionAttribute as CFString, &ptVal) == .success, let p = ptVal {
        AXValueGetValue(p as! AXValue, .cgPoint, &pt)
    }
    if AXUIElementCopyAttributeValue(el, kAXSizeAttribute as CFString, &szVal) == .success, let s = szVal {
        AXValueGetValue(s as! AXValue, .cgSize, &sz)
    }
    return CGRect(origin: pt, size: sz)
}

func findChatElements(in parent: AXUIElement) -> (scrollArea: AXUIElement, table: AXUIElement, scrollBar: AXUIElement)? {
    var foundScrollArea: AXUIElement?
    var foundTable: AXUIElement?
    
    func search(_ el: AXUIElement) {
        var roleVal: AnyObject?
        AXUIElementCopyAttributeValue(el, kAXRoleAttribute as CFString, &roleVal)
        if (roleVal as? String) == "AXScrollArea" {
            let r = getElementRect(el)
            // 聊天消息区位于窗口主体右侧，宽高通常 > 400x300
            if r.width > 400 && r.height > 300 {
                var chVal: AnyObject?
                if AXUIElementCopyAttributeValue(el, kAXChildrenAttribute as CFString, &chVal) == .success,
                   let children = chVal as? [AXUIElement] {
                    for c in children {
                        var crVal: AnyObject?
                        AXUIElementCopyAttributeValue(c, kAXRoleAttribute as CFString, &crVal)
                        if (crVal as? String) == "AXTable" {
                            foundScrollArea = el
                            foundTable = c
                            return
                        }
                    }
                }
            }
        }
        var chVal: AnyObject?
        if AXUIElementCopyAttributeValue(el, kAXChildrenAttribute as CFString, &chVal) == .success,
           let children = chVal as? [AXUIElement] {
            for c in children {
                search(c)
                if foundScrollArea != nil { return }
            }
        }
    }
    
    search(parent)
    guard let sa = foundScrollArea, let tb = foundTable else { return nil }
    var sbVal: AnyObject?
    AXUIElementCopyAttributeValue(sa, kAXVerticalScrollBarAttribute as CFString, &sbVal)
    guard let sb = sbVal as! AXUIElement? else { return nil }
    return (sa, tb, sb)
}

func parseChatRow(_ row: AXUIElement) -> (sender: String, time: String, content: String)? {
    var sender = ""
    var time = ""
    var contents: [String] = []
    
    func walk(_ el: AXUIElement) {
        var rVal: AnyObject?, vVal: AnyObject?, tVal: AnyObject?, dVal: AnyObject?
        AXUIElementCopyAttributeValue(el, kAXRoleAttribute as CFString, &rVal)
        AXUIElementCopyAttributeValue(el, kAXValueAttribute as CFString, &vVal)
        AXUIElementCopyAttributeValue(el, kAXTitleAttribute as CFString, &tVal)
        AXUIElementCopyAttributeValue(el, kAXDescriptionAttribute as CFString, &dVal)
        
        let role = rVal as? String ?? ""
        let val = (vVal as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let title = (tVal as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        let desc = (dVal as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        
        if role == "AXButton" && sender.isEmpty && !title.isEmpty && title != "Button" {
            sender = title
        } else if role == "AXStaticText" && (val.contains(":") || val.contains("/") || val.contains("-") || val.contains("Yesterday") || val.contains("Today") || val.contains("昨天") || val.contains("今天")) {
            if time.isEmpty { time = val } else { contents.append(val) }
        } else if role == "AXTextArea" || role == "AXStaticText" {
            let text = !val.isEmpty ? val : (!title.isEmpty ? title : desc)
            if !text.isEmpty && text != sender && text != time && text != "Button" {
                contents.append(text)
            }
        }
        
        var chVal: AnyObject?
        if AXUIElementCopyAttributeValue(el, kAXChildrenAttribute as CFString, &chVal) == .success,
           let children = chVal as? [AXUIElement] {
            for c in children { walk(c) }
        }
    }
    
    walk(row)
    let body = contents.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
    if sender.isEmpty && body.isEmpty && time.isEmpty { return nil }
    return (sender: sender.isEmpty ? "我" : sender, time: time, content: body)
}

// MARK: - 命令行参数解析
var direction = "down" // "down" 向下浏览最新，"up" 向上浏览历史
var outputFormat = "text" // "text" 或 "json"
var shouldRestore = false
var maxPages = 50
var fromCurrent = true

var args = CommandLine.arguments.dropFirst()
while !args.isEmpty {
    let arg = args.removeFirst()
    switch arg {
    case "--direction", "-d":
        if let val = args.first, (val == "down" || val == "up") {
            direction = val
            args = args.dropFirst()
        }
    case "--format", "-f":
        if let val = args.first, (val == "text" || val == "json") {
            outputFormat = val
            args = args.dropFirst()
        }
    case "--restore", "-r":
        shouldRestore = true
    case "--max-pages", "-m":
        if let val = args.first, let num = Int(val) {
            maxPages = num
            args = args.dropFirst()
        }
    case "--all":
        fromCurrent = false
    case "--help", "-h":
        print("""
        使用说明:
          dump_chat.swift [选项]

        选项:
          -d, --direction <down|up>  滚动抓取方向 (默认 down: 向下查看更新消息)
          -f, --format <text|json>   输出格式 (默认 text)
          -r, --restore              抓取完成后将滚动条恢复到执行前位置
          -m, --max-pages <数字>     最大滚动翻页数 (默认 50)
              --all                  不限制从当前视口开始，收录已加载的所有行
          -h, --help                 显示本帮助
        """)
        exit(0)
    default:
        break
    }
}

// MARK: - 主流程
guard AXIsProcessTrusted() else {
    fputs("错误: 未授予辅助功能权限，请在「系统设置 → 隐私与安全性 → 辅助功能」中为当前终端开启授权。\n", stderr)
    exit(1)
}

let apps = NSRunningApplication.runningApplications(withBundleIdentifier: "com.tencent.WeWorkMac")
guard let app = apps.first else {
    fputs("错误: 未找到运行中的企业微信进程 (com.tencent.WeWorkMac)\n", stderr)
    exit(1)
}

let appElement = AXUIElementCreateApplication(app.processIdentifier)
// 激活 Chromium 完整无障碍树
AXUIElementSetAttributeValue(appElement, "AXEnhancedUserInterface" as CFString, kCFBooleanTrue)
AXUIElementSetAttributeValue(appElement, "AXManualAccessibility" as CFString, kCFBooleanTrue)

var windowsVal: AnyObject?
AXUIElementCopyAttributeValue(appElement, kAXWindowsAttribute as CFString, &windowsVal)
guard let win = (windowsVal as? [AXUIElement])?.first else {
    fputs("错误: 未找到企业微信主窗口\n", stderr)
    exit(1)
}

guard let (scrollArea, table, scrollBar) = findChatElements(in: win) else {
    fputs("错误: 未能定位到当前对话的消息列表区域\n", stderr)
    exit(1)
}

// 记录初始位置
var initialValObj: AnyObject?
AXUIElementCopyAttributeValue(scrollBar, kAXValueAttribute as CFString, &initialValObj)
let initialScrollVal = (initialValObj as? NSNumber)?.doubleValue ?? 0.0

let viewportRect = getElementRect(scrollArea)
var allMessages: [ChatMessage] = []
var seenIds = Set<String>()

var isFirst = true
var zeroAddedCount = 0
var lastScrollVal = initialScrollVal

// 重要说明：在 Chromium/CEF Accessibility 规范中
// AXScrollUpByPage = 视觉向下看最新消息（向上推内容）
// AXScrollDownByPage = 视觉向上看历史消息（向下推内容）
let scrollAction = (direction == "down") ? "AXScrollUpByPage" : "AXScrollDownByPage"

for _ in 1...maxPages {
    var rowsVal: AnyObject?
    AXUIElementCopyAttributeValue(table, kAXRowsAttribute as CFString, &rowsVal)
    let rows = (rowsVal as? [AXUIElement]) ?? []
    
    var added = 0
    for r in rows {
        let rRect = getElementRect(r)
        
        // 初始视口裁剪：向下时过滤在视口上方完全移出的行；向上时过滤在视口下方完全移出的行
        if isFirst && fromCurrent {
            if direction == "down" && rRect.maxY < viewportRect.minY {
                continue
            } else if direction == "up" && rRect.minY > viewportRect.maxY {
                continue
            }
        }
        
        if let (sender, time, content) = parseChatRow(r) {
            let tempMsg = ChatMessage(index: 0, sender: sender, time: time, content: content)
            if !seenIds.contains(tempMsg.identifier) {
                seenIds.insert(tempMsg.identifier)
                let item = ChatMessage(index: allMessages.count + 1, sender: sender, time: time, content: content)
                allMessages.append(item)
                added += 1
            }
        }
    }
    isFirst = false
    
    var curValObj: AnyObject?
    AXUIElementCopyAttributeValue(scrollBar, kAXValueAttribute as CFString, &curValObj)
    let curVal = (curValObj as? NSNumber)?.doubleValue ?? 0.0
    
    // 触底判定
    if direction == "down" {
        if curVal >= 0.995 || (added == 0 && abs(curVal - lastScrollVal) < 0.001) {
            zeroAddedCount += 1
            if zeroAddedCount >= 2 || curVal >= 0.995 { break }
        } else {
            zeroAddedCount = 0
        }
    } else {
        if curVal <= 0.005 || (added == 0 && abs(curVal - lastScrollVal) < 0.001) {
            zeroAddedCount += 1
            if zeroAddedCount >= 2 || curVal <= 0.005 { break }
        } else {
            zeroAddedCount = 0
        }
    }
    lastScrollVal = curVal
    
    // 执行翻页
    _ = AXUIElementPerformAction(scrollArea, scrollAction as CFString)
    usleep(350_000) // 等待 CEF 虚拟 DOM 与 Accessibility 渲染
}

// 获取最终滚动条数值
var finalValObj: AnyObject?
AXUIElementCopyAttributeValue(scrollBar, kAXValueAttribute as CFString, &finalValObj)
let finalScrollVal = (finalValObj as? NSNumber)?.doubleValue ?? 0.0

// 如果启用了恢复位置
if shouldRestore {
    AXUIElementSetAttributeValue(scrollBar, kAXValueAttribute as CFString, NSNumber(value: initialScrollVal))
}

// MARK: - 输出结果
if outputFormat == "json" {
    let payload = OutputPayload(
        initialScrollValue: initialScrollVal,
        finalScrollValue: finalScrollVal,
        direction: direction,
        restored: shouldRestore,
        totalMessages: allMessages.count,
        messages: allMessages
    )
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    if let data = try? encoder.encode(payload), let jsonString = String(data: data, encoding: .utf8) {
        print(jsonString)
    }
} else {
    for m in allMessages {
        let t = m.time.isEmpty ? "" : " [\(m.time)]"
        print("[\(m.index)] \(m.sender)\(t):")
        for line in m.content.split(separator: "\n") {
            print("    \(line)")
        }
    }
}
