# CLAUDE.md — companion-module-adder-ccs-pro

## Project Identity

Bitfocus Companion module for the **Adder CCS-PRO4** USB KVM switch.

- Language: JavaScript (CommonJS)
- SDK: `@companion-module/base` v1.14.x (API 1.x)
- Runtime: Node 22, Yarn 4
- Module ID: `companion-module-adder-ccs-pro` (must match folder name and `manifest.json` `id`)

---

## Build & Tooling

There is **no build step**. Companion runs `src/main.js` directly.

```bash
yarn install          # install dependencies
yarn format           # run prettier across all files
yarn package          # zip module for distribution (companion-module-build)
```

No `dist/` folder. No TypeScript. No unit test runner configured.

---

## Dev Loop

1. Clone/symlink this repo into Companion's developer modules folder.
2. Open Companion web UI → Connections → Add connection → find `adder-ccs-pro`.
3. Edit any `src/*.js` file.
4. In Companion web UI, click the connection's **restart** icon to reload the module.
5. Check the Companion log panel for errors from `this.log(...)`.

---

## Key Files

| File                      | Purpose                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------- |
| `src/main.js`             | `ModuleInstance` class — lifecycle, polling loop, wires all sub-modules                      |
| `src/api.js`              | `sendCommand(host, params, auth)` — HTTP GET to device                                       |
| `src/actions.js`          | Action definitions (`switch_km`, `switch_spk`, `switch_usb1`, `switch_usb2`, `switch_all`)   |
| `src/feedbacks.js`        | Boolean feedback per peripheral — compares `this.channelState[peripheral]` to chosen channel |
| `src/variables.js`        | Variable definitions: `km_channel`, `spk_channel`, `usb1_channel`, `usb2_channel`            |
| `src/presets.js`          | 16 presets — one per peripheral × channel combination                                        |
| `src/upgrades.js`         | Empty array — required by `runEntrypoint`                                                    |
| `companion/manifest.json` | Module identity, maintainer, product info                                                    |
| `companion/HELP.md`       | End-user documentation shown in Companion UI                                                 |

---

## Device API

**Single HTTP GET endpoint:**

```
GET http://{ip}/cgi-bin/channel?km={1-4}&spk={1-4}&usb1={1-4}&usb2={1-4}
```

- All parameters are optional — send only what you need to switch.
- Authentication: optional HTTP Basic auth (`username:password`).
- Default device IP: `192.168.1.22`.
- No status push endpoint — the device does not send state back.

**Example:** Switch KM to channel 2, speakers to channel 3:

```
GET http://192.168.1.22/cgi-bin/channel?km=2&spk=3
```

---

## State Tracking

The device has no push/subscribe API. State is tracked optimistically:

```js
this.channelState = { km: 1, spk: 1, usb1: 1, usb2: 1 }
```

- Updated immediately after every successful command.
- Optionally polled from the device's HTML status page on an interval to catch external switches (front panel, hotkeys, other controllers).
- `this.checkFeedbacks()` is called after every state update to refresh button colours.

**Peripheral keys:** `km`, `spk`, `usb1`, `usb2` — each accepts values `1`–`4`.

---

## HTTP Implementation

Use Node's built-in `http`/`https` modules — **no extra dependencies needed**.

```js
const http = require('http')
```

---

## Model Selection (token efficiency)

Default to the smallest model that can handle the task. Most work on this project is Haiku-level.

| Model                            | Use when                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude-haiku-3-5` **(default)** | Routine edits: adding/modifying actions, variable names, feedback callbacks, HELP.md copy, formatting fixes. The majority of tasks.         |
| `claude-sonnet-4-5`              | Moderate complexity: polling loop design, wiring lifecycle methods, writing `api.js` from scratch, debugging unexpected feedback behaviour. |
| `claude-opus-4-6`                | Last resort only: novel architecture decisions or subtle async bugs Sonnet cannot resolve.                                                  |

**Keep context windows tight.** Pass only the relevant `src/*.js` file per task — do not load the entire repo into context for a single-file edit.
