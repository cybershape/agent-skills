# Remote Device Automation

Adapted from the official WeChat Mini Program remote-automation documentation.

## Preconditions

- The target device must use Mini Program base library `2.7.3` or later.
- Validate the flow in the simulator first, then switch to a real device if needed.

## Option 1: start remote debugging through the SDK

```js
await miniProgram.remote()
```

What happens:

- WeChat DevTools enters the remote debugging flow.
- A QR code is printed in the console.
- After the target device scans and connects, later script steps run on the device.

## Option 2: start remote debugging manually

Good fit:

- DevTools stays open all the time
- you use `automator.connect()` to attach to an existing DevTools window

Sequence:

1. Manually open remote debugging in WeChat DevTools.
2. Wait until the device is connected.
3. Run the automation script.

## Usage guidelines

- Remote debugging changes the execution target, not the structure of the `MiniProgram`, `Page`, or `Element` APIs.
- If the flow fails on a real device, reproduce it in the simulator first to separate device-specific issues from script issues.
- Screenshot support remains simulator-oriented; `miniProgram.screenshot()` does not work for remote real-device execution.

## Related APIs

- `miniProgram.remote(auto?)`
- `miniProgram.disconnect()`
- `miniProgram.close()`

## Official page

- https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/remote.html
