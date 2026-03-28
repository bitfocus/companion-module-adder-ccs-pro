---
name: bitfocus-companion-module-development
description: >
  Develop a Bitfocus Companion module from scratch using the official JavaScript
  template. Use when creating a new Companion module, adding actions/feedbacks/
  variables/presets to an existing one, wiring up an HTTP device, or setting up
  a polling loop. Covers the full lifecycle pattern for API 1.x (runEntrypoint).
---

# Bitfocus Companion Module Development

## Overview

A Companion **module** (also called a Connection) lets Companion control a piece
of hardware or software. It runs in Node.js as a CommonJS package loaded by
Companion from a local developer folder or installed from the registry.

Key concepts:

- **Actions** — buttons that trigger a command on the device
- **Feedbacks** — boolean expressions that change button appearance based on device state
- **Variables** — live values exposed to Companion's expression engine
- **Presets** — pre-built button layouts combining an action + feedback

---

## 1. Scaffold the Project

Clone or copy the official JavaScript template:

```bash
git clone https://github.com/bitfocus/companion-module-template-js companion-module-{manufacturer}-{product}
cd companion-module-{manufacturer}-{product}
yarn install
```

Rename the folder and update these fields **everywhere** (they must all match):

- Folder name: `companion-module-{manufacturer}-{product}`
- `package.json` → `"name"`
- `companion/manifest.json` → `"id"`, `"name"`, `"manufacturer"`, `"products"`

---

## 2. File Structure

```
companion-module-{manufacturer}-{product}/
├── companion/
│   ├── manifest.json     — module identity, required by Companion
│   └── HELP.md           — shown to users in the Connections UI
├── src/
│   ├── main.js           — ModuleInstance class, lifecycle, entry point
│   ├── actions.js        — module.exports = function(self) { ... }
│   ├── feedbacks.js      — module.exports = function(self) { ... }
│   ├── variables.js      — module.exports = function(self) { ... }
│   ├── presets.js        — module.exports = function(self) { ... }
│   ├── api.js            — device communication helpers
│   └── upgrades.js       — module.exports = [] (never remove entries once added)
├── package.json
└── .gitignore
```

---

## 3. main.js — Module Lifecycle (API 1.x)

The entry point must call `runEntrypoint`. The class extends `InstanceBase`.

```js
const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.channelState = { km: 1, spk: 1, usb1: 1, usb2: 1 } // device state cache

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()
		this.startPolling()

		this.updateStatus(InstanceStatus.Ok)
	}

	async destroy() {
		this.stopPolling()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.startPolling()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 8,
				default: '192.168.1.22',
				regex: Regex.IP,
			},
			{
				type: 'number',
				id: 'pollInterval',
				label: 'Poll Interval (seconds)',
				width: 4,
				default: 5,
				min: 2,
				max: 60,
			},
		]
	}

	startPolling() {
		if (this._pollTimer) return
		const interval = (this.config.pollInterval || 5) * 1000
		this._pollTimer = setInterval(() => this.pollDevice(), interval)
	}

	stopPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer)
			this._pollTimer = null
		}
	}

	async pollDevice() {
		// fetch current state from device; update this.channelState; call this.checkFeedbacks()
	}

	updateActions() {
		UpdateActions(this)
	}
	updateFeedbacks() {
		UpdateFeedbacks(this)
	}
	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
```

**Lifecycle order:** `constructor` → `init` → (`configUpdated` on user changes) → `destroy`

Do **not** await long-running connections inside `init()` — Companion will time out the module.

---

## 4. getConfigFields() — User Configuration

Config fields are rendered in the Connections panel. Use `Regex` validators from the SDK.

```js
const { Regex } = require('@companion-module/base')

// Common field types:
{ type: 'textinput', id: 'host',     label: 'IP Address', regex: Regex.IP }
{ type: 'textinput', id: 'port',     label: 'Port',       regex: Regex.PORT }
{ type: 'textinput', id: 'username', label: 'Username',   width: 6 }
{ type: 'textinput', id: 'password', label: 'Password',   width: 6 }
{ type: 'number',    id: 'interval', label: 'Poll (s)',   default: 5, min: 1, max: 60 }
{ type: 'checkbox',  id: 'useAuth',  label: 'Use Auth',   default: false }
```

Access values in your module as `this.config.host`, `this.config.pollInterval`, etc.

---

## 5. actions.js — Action Definitions

Each action has an `id`, a `name`, `options` array, and an async `callback`.

```js
module.exports = function (self) {
	self.setActionDefinitions({
		switch_km: {
			name: 'Switch KM to Channel',
			options: [
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: '1',
					choices: [
						{ id: '1', label: 'Channel 1' },
						{ id: '2', label: 'Channel 2' },
						{ id: '3', label: 'Channel 3' },
						{ id: '4', label: 'Channel 4' },
					],
				},
			],
			callback: async (event) => {
				const ch = parseInt(event.options.channel)
				await self.sendCommand({ km: ch })
				self.channelState.km = ch
				self.setVariableValues({ km_channel: ch })
				self.checkFeedbacks('channel_active')
			},
		},
	})
}
```

**Dropdown vs number:** Use `dropdown` for a fixed set of options (channels 1–4). Use `number` only for genuinely open-ended numeric input.

---

## 6. feedbacks.js — Boolean Feedbacks

Boolean feedbacks change button colour when a condition is true.

```js
const { combineRgb } = require('@companion-module/base')

module.exports = function (self) {
	self.setFeedbackDefinitions({
		channel_active: {
			name: 'Channel Active',
			type: 'boolean',
			label: 'Is peripheral on channel?',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'peripheral',
					type: 'dropdown',
					label: 'Peripheral',
					default: 'km',
					choices: [
						{ id: 'km', label: 'Keyboard & Mouse' },
						{ id: 'spk', label: 'Speakers' },
						{ id: 'usb1', label: 'USB 1' },
						{ id: 'usb2', label: 'USB 2' },
					],
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: '1',
					choices: [
						{ id: '1', label: 'Channel 1' },
						{ id: '2', label: 'Channel 2' },
						{ id: '3', label: 'Channel 3' },
						{ id: '4', label: 'Channel 4' },
					],
				},
			],
			callback: (feedback) => {
				const peripheral = feedback.options.peripheral
				const expected = parseInt(feedback.options.channel)
				return self.channelState[peripheral] === expected
			},
		},
	})
}
```

Call `self.checkFeedbacks('feedback_id')` (or `self.checkFeedbacks()` for all) after any state change.

---

## 7. variables.js — Variable Definitions

Variables are declared once; values are set separately.

```js
// variables.js — declare the variables
module.exports = function (self) {
	self.setVariableDefinitions([
		{ variableId: 'km_channel', name: 'KM Active Channel' },
		{ variableId: 'spk_channel', name: 'Speaker Active Channel' },
		{ variableId: 'usb1_channel', name: 'USB1 Active Channel' },
		{ variableId: 'usb2_channel', name: 'USB2 Active Channel' },
	])
}

// Elsewhere (e.g. after a command or poll), set values:
self.setVariableValues({
	km_channel: self.channelState.km,
	spk_channel: self.channelState.spk,
	usb1_channel: self.channelState.usb1,
	usb2_channel: self.channelState.usb2,
})
```

---

## 8. presets.js — Preset Definitions

Presets are pre-built buttons that appear in the Companion button picker.

```js
module.exports = function (self) {
	const presets = {}

	const peripherals = [
		{ key: 'km', label: 'KM', actionId: 'switch_km' },
		{ key: 'spk', label: 'SPK', actionId: 'switch_spk' },
		{ key: 'usb1', label: 'USB1', actionId: 'switch_usb1' },
		{ key: 'usb2', label: 'USB2', actionId: 'switch_usb2' },
	]

	for (const p of peripherals) {
		for (let ch = 1; ch <= 4; ch++) {
			presets[`${p.key}_ch${ch}`] = {
				type: 'button',
				category: `${p.label} Switch`,
				name: `${p.label} → Ch ${ch}`,
				style: {
					text: `${p.label}\\nCh ${ch}`,
					size: '18',
					color: 0xffffff,
					bgcolor: 0x000000,
				},
				steps: [
					{
						down: [{ actionId: p.actionId, options: { channel: String(ch) } }],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'channel_active',
						options: { peripheral: p.key, channel: String(ch) },
					},
				],
			}
		}
	}

	self.setPresetDefinitions(presets)
}
```

---

## 9. api.js — HTTP Communication (Node built-ins)

Use Node's built-in `http`/`https` — no extra dependencies needed.

```js
const http = require('http')
const https = require('https')

/**
 * Send a channel-switch command to the CCS-PRO device.
 * @param {string} host   - device IP address
 * @param {object} params - e.g. { km: 2, spk: 3 }
 * @param {object} [auth] - optional { username, password }
 * @returns {Promise<void>}
 */
function sendCommand(host, params, auth) {
	return new Promise((resolve, reject) => {
		const query = Object.entries(params)
			.map(([k, v]) => `${k}=${v}`)
			.join('&')
		const path = `/cgi-bin/channel?${query}`

		const options = { host, path, method: 'GET' }
		if (auth && auth.username) {
			const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
			options.headers = { Authorization: `Basic ${encoded}` }
		}

		const req = http.request(options, (res) => {
			res.resume() // drain the response body
			if (res.statusCode === 200) resolve()
			else reject(new Error(`HTTP ${res.statusCode}`))
		})

		req.on('error', reject)
		req.setTimeout(5000, () => {
			req.destroy(new Error('timeout'))
		})
		req.end()
	})
}

module.exports = { sendCommand }
```

---

## 10. HTTP Polling Pattern

Store the timer handle on `this` so it can be cleared in `destroy()`.

```js
// In main.js:
startPolling() {
  if (this._pollTimer) return
  const ms = (this.config.pollInterval || 5) * 1000
  this._pollTimer = setInterval(() => this.pollDevice(), ms)
}

stopPolling() {
  if (this._pollTimer) {
    clearInterval(this._pollTimer)
    this._pollTimer = null
  }
}

async pollDevice() {
  try {
    // parse device status HTML or a status endpoint
    // update this.channelState
    // call this.setVariableValues({ ... })
    // call this.checkFeedbacks()
    this.updateStatus(InstanceStatus.Ok)
  } catch (err) {
    this.log('warn', `Poll failed: ${err.message}`)
    this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
  }
}
```

Always call `stopPolling()` in both `destroy()` and `configUpdated()` (before restarting).

---

## 11. manifest.json

```json
{
	"$schema": "../node_modules/@companion-module/base/assets/manifest.schema.json",
	"id": "companion-module-adder-ccs-pro",
	"name": "Adder CCS-PRO",
	"shortname": "CCS-PRO",
	"description": "Control the Adder CCS-PRO4 KM switch via HTTP",
	"version": "0.1.0",
	"license": "MIT",
	"repository": "git+https://github.com/your-org/companion-module-adder-ccs-pro.git",
	"bugs": "https://github.com/your-org/companion-module-adder-ccs-pro/issues",
	"maintainers": [{ "name": "Your Name", "email": "your@email.com" }],
	"runtime": {
		"type": "node22",
		"api": "nodejs-ipc",
		"apiVersion": "0.0.0",
		"entrypoint": "../src/main.js"
	},
	"legacyIds": [],
	"manufacturer": "Adder",
	"products": ["CCS-PRO4"],
	"keywords": ["kvm", "adder", "ccs-pro"]
}
```

The `id` field **must** match the package name in `package.json` and the folder name.

---

## 12. Developer Folder Setup (Live Testing)

1. Companion v3/v4 supports loading modules from a local folder.
2. In Companion Settings → Developer, set the developer modules path.
3. Either place (or symlink) your module folder there:
   ```bash
   ln -s /path/to/companion-module-adder-ccs-pro ~/Documents/Companion/modules/
   ```
4. Restart Companion, then add a new connection — your module appears in the list.
5. After each code edit, click the **restart** icon on the connection in the Companion UI.

---

## Common Mistakes

- **`id` mismatch** — folder name, `package.json` `"name"`, and `manifest.json` `"id"` must all be identical.
- **Awaiting in `init()`** — do not `await` a connection attempt; fire and forget, handle errors in callbacks.
- **Not clearing `_pollTimer`** — always call `stopPolling()` in `destroy()` and before `startPolling()` in `configUpdated()`.
- **Forgetting `checkFeedbacks()`** — call it after every state change or feedbacks will not update on buttons.
- **Adding then removing upgrade scripts** — once an upgrade script is added to `upgrades.js`, it must stay there permanently.
