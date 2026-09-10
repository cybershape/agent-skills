# Automator API

Adapted from the official WeChat Mini Program `Automator` documentation.

## `automator.connect(options)`

Connect to a running WeChat DevTools instance that already exposes an automation port.

### Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `wsEndpoint` | `string` | Yes | The DevTools WebSocket endpoint |

### Good fits

- DevTools is already running in automation mode
- the team already uses a fixed local endpoint such as `ws://localhost:9420`
- you want to reuse an existing healthy DevTools window

### Common startup pattern

```bash
cli --auto /absolute/path/to/project --auto-port 9420
```

## `automator.launch(options)`

Start and connect to WeChat DevTools.

### Parameters

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `cliPath` | `string` | No | - | Absolute path to the DevTools CLI |
| `projectPath` | `string` | Yes | - | Absolute path to the Mini Program project |
| `timeout` | `number` | No | `30000` | Maximum launch wait time |
| `port` | `number` | No | - | WebSocket port |
| `account` | `string` | No | - | `openid` for multi-account debugging |
| `projectConfig` | `Object` | No | - | Overrides for `project.config.json` |
| `ticket` | `string` | No | - | DevTools login ticket |

### Common CLI paths

- macOS: `/Applications/wechatwebdevtools.app/Contents/MacOS/cli`
- Windows: `C:/Program Files (x86)/Tencent/WeChatWebDevTools/cli.bat` (actual installation path may vary)

## Practical guidance

- Enable `CLI/HTTP` invocation in DevTools before automation starts.
- Use `account` when you need multi-account debugging.
- Use `ticket`, `getTicket`, `setTicket`, and `refreshTicket` for long-lived or cross-machine sessions.
- If `connect()` is technically successful but later calls keep timing out, launching a fresh session on a new port is often more reliable.

## Suggested strategy

1. Try `connect({ wsEndpoint: 'ws://localhost:PORT' })` when an existing endpoint is expected.
2. Fall back to `launch({ projectPath, port: PORT })` if connection fails.
3. If the reused session is unstable, launch a dedicated new session on a different port.
4. Avoid opening many redundant DevTools windows during retries.

## Official page

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/automator.html
