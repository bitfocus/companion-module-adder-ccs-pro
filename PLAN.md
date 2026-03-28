# companion-module-adder-ccs-pro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully functional Bitfocus Companion module that controls the Adder CCS-PRO4 KM switch over HTTP, with actions, feedbacks, variables, and presets.

**Architecture:** CommonJS JavaScript module extending `InstanceBase` from `@companion-module/base` v1.14.x. Device state is tracked optimistically in `this.channelState` after each command and refreshed by an optional polling loop. All HTTP is done with Node's built-in `http` module.

**Tech Stack:** Node 22, Yarn 4, `@companion-module/base` v1.14.1, `@companion-module/tools` v2.6.1, Prettier. No build step — Companion runs `src/main.js` directly.

---

## File Map

| File                      | Create / Modify | Responsibility                                   |
| ------------------------- | --------------- | ------------------------------------------------ |
| `package.json`            | Create          | npm identity, dependencies, scripts              |
| `companion/manifest.json` | Create          | Companion module identity                        |
| `companion/HELP.md`       | Create          | End-user help shown in Companion UI              |
| `.gitignore`              | Create          | Ignore `node_modules/`, `*.tgz`                  |
| `.prettierignore`         | Create          | Ignore `node_modules/` for formatter             |
| `.yarnrc.yml`             | Create          | Yarn 4 config                                    |
| `src/upgrades.js`         | Create          | Empty array, required by `runEntrypoint`         |
| `src/api.js`              | Create          | `sendCommand(host, params, auth)` HTTP helper    |
| `src/main.js`             | Create          | `ModuleInstance` class, full lifecycle + polling |
| `src/actions.js`          | Create          | 5 action definitions                             |
| `src/variables.js`        | Create          | 4 variable definitions                           |
| `src/feedbacks.js`        | Create          | 1 boolean feedback (`channel_active`)            |
| `src/presets.js`          | Create          | 16 presets (4 peripherals × 4 channels)          |
| `README.md`               | Create          | Developer notes                                  |

---

## Task 1: Project Scaffold

**Files:**

- Create: `package.json`
- Create: `companion/manifest.json`
- Create: `companion/HELP.md`
- Create: `.gitignore`
- Create: `.prettierignore`
- Create: `.yarnrc.yml`
- Create: `src/upgrades.js`
- Create: `README.md`

- [ ] **Step 1: Create `package.json`**

```json
{
	"name": "companion-module-adder-ccs-pro",
	"version": "0.1.0",
	"main": "src/main.js",
	"scripts": {
		"format": "prettier -w .",
		"package": "companion-module-build"
	},
	"license": "MIT",
	"repository": {
		"type": "git",
		"url": "git+https://github.com/bitfocus/companion-module-adder-ccs-pro.git"
	},
	"engines": {
		"node": "^22.20",
		"yarn": "^4"
	},
	"dependencies": {
		"@companion-module/base": "~1.14.1"
	},
	"devDependencies": {
		"@companion-module/tools": "^2.6.1",
		"prettier": "^3.7.4"
	},
	"prettier": "@companion-module/tools/.prettierrc.json",
	"packageManager": "yarn@4.12.0"
}
```

- [ ] **Step 2: Create `companion/manifest.json`**

```json
{
	"$schema": "../node_modules/@companion-module/base/assets/manifest.schema.json",
	"id": "companion-module-adder-ccs-pro",
	"name": "Adder CCS-PRO",
	"shortname": "CCS-PRO",
	"description": "Control the Adder CCS-PRO4 KM switch via HTTP",
	"version": "0.1.0",
	"license": "MIT",
	"repository": "git+https://github.com/bitfocus/companion-module-adder-ccs-pro.git",
	"bugs": "https://github.com/bitfocus/companion-module-adder-ccs-pro/issues",
	"maintainers": [
		{
			"name": "Your Name",
			"email": "your@email.com"
		}
	],
	"runtime": {
		"type": "node22",
		"api": "nodejs-ipc",
		"apiVersion": "0.0.0",
		"entrypoint": "../src/main.js"
	},
	"legacyIds": [],
	"manufacturer": "Adder",
	"products": ["CCS-PRO4"],
	"keywords": ["kvm", "adder", "ccs-pro", "switch"]
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
*.tgz
.yarn/cache
.yarn/install-state.gz
```

- [ ] **Step 4: Create `.prettierignore`**

```
node_modules/
```

- [ ] **Step 5: Create `.yarnrc.yml`**

```yaml
nodeLinker: node-modules
```

- [ ] **Step 6: Create `src/upgrades.js`**

```js
module.exports = [
	/*
	 * Place your upgrade scripts here
	 * Remember that once it has been added it cannot be removed!
	 */
]
```

- [ ] **Step 7: Create a minimal `companion/HELP.md`** (placeholder; filled out in Task 9)

```markdown
## Adder CCS-PRO

See README.md for setup instructions. Full documentation coming soon.
```

- [ ] **Step 8: Create `README.md`**

```markdown
# companion-module-adder-ccs-pro

Bitfocus Companion module for the Adder CCS-PRO4 KM switch.

## Setup

1. `yarn install`
2. Set the developer modules path in Companion Settings → Developer.
3. Symlink or copy this folder into that path.
4. Add a new connection in Companion and search for "Adder CCS-PRO".

## Development

- Edit files in `src/`.
- Click the restart icon on the connection in the Companion UI to reload.
- `yarn format` to run Prettier.
- `yarn package` to zip for distribution.

## Device API

HTTP GET: `http://{ip}/cgi-bin/channel?km={1-4}&spk={1-4}&usb1={1-4}&usb2={1-4}`

Default device IP: `192.168.1.22`
```

- [ ] **Step 9: Install dependencies**

```bash
yarn install
```

Expected: `node_modules/` created, `yarn.lock` updated.

- [ ] **Step 10: Commit**

```bash
git init
git add .
git commit -m "feat: scaffold project from template"
```

---

## Task 2: HTTP API Helper

**Files:**

- Create: `src/api.js`

- [ ] **Step 1: Create `src/api.js`**

```js
'use strict'

const http = require('http')

/**
 * Send a channel-switch command to the CCS-PRO device.
 *
 * @param {string} host   - device IP address (e.g. '192.168.1.22')
 * @param {object} params - peripheral→channel map, e.g. { km: 2, spk: 3 }
 * @param {object} [auth] - optional { username: string, password: string }
 * @returns {Promise<void>} resolves on HTTP 200, rejects otherwise
 */
function sendCommand(host, params, auth) {
	return new Promise((resolve, reject) => {
		const query = Object.entries(params)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&')
		const path = `/cgi-bin/channel?${query}`

		const options = {
			host,
			path,
			method: 'GET',
			timeout: 5000,
		}

		if (auth && auth.username) {
			const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
			options.headers = { Authorization: `Basic ${encoded}` }
		}

		const req = http.request(options, (res) => {
			res.resume() // drain response body so the socket is freed
			if (res.statusCode === 200) {
				resolve()
			} else {
				reject(new Error(`HTTP ${res.statusCode}`))
			}
		})

		req.on('error', reject)
		req.on('timeout', () => {
			req.destroy(new Error('Request timed out'))
		})
		req.end()
	})
}

module.exports = { sendCommand }
```

- [ ] **Step 2: Verify manually**

Open Node REPL and run:

```js
const { sendCommand } = require('./src/api')
// With a real device at 192.168.1.22:
sendCommand('192.168.1.22', { km: 1 })
	.then(() => console.log('ok'))
	.catch(console.error)
// Without a device, expect ECONNREFUSED — that confirms the HTTP call fires correctly.
```

- [ ] **Step 3: Commit**

```bash
git add src/api.js
git commit -m "feat: add HTTP sendCommand helper"
```

---

## Task 3: Config Fields

**Files:**

- Modify: `src/main.js` (initial skeleton with `getConfigFields`)

- [ ] **Step 1: Create initial `src/main.js` with config fields only**

```js
'use strict'

const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.updateStatus(InstanceStatus.Ok)
	}

	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
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
				tooltip: 'How often to check device state for external switches',
			},
			{
				type: 'checkbox',
				id: 'useAuth',
				label: 'Enable Authentication',
				width: 12,
				default: false,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 6,
				isVisible: (config) => !!config.useAuth,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
				isVisible: (config) => !!config.useAuth,
			},
		]
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
```

- [ ] **Step 2: Load in Companion and verify config panel**

Add the connection in Companion. Open its config. Confirm:

- IP field with `192.168.1.22` default
- Poll interval number field
- Enable Authentication checkbox
- Username/Password fields appear only when checkbox is ticked

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: add config fields (IP, polling, auth)"
```

---

## Task 4: Actions

**Files:**

- Create: `src/actions.js`
- Modify: `src/main.js` (add `updateActions()` call and require)

- [ ] **Step 1: Create `src/actions.js`**

```js
'use strict'

const { sendCommand } = require('./api')

const CHANNEL_CHOICES = [
	{ id: '1', label: 'Channel 1' },
	{ id: '2', label: 'Channel 2' },
	{ id: '3', label: 'Channel 3' },
	{ id: '4', label: 'Channel 4' },
]

module.exports = function (self) {
	self.setActionDefinitions({
		switch_km: {
			name: 'Switch Keyboard & Mouse to Channel',
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: CHANNEL_CHOICES }],
			callback: async (event) => {
				const ch = parseInt(event.options.channel)
				const auth = self.config.useAuth
					? { username: self.config.username, password: self.config.password }
					: undefined
				try {
					await sendCommand(self.config.host, { km: ch }, auth)
					self.channelState.km = ch
					self.setVariableValues({ km_channel: ch })
					self.checkFeedbacks('channel_active')
				} catch (err) {
					self.log('error', `switch_km failed: ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				}
			},
		},

		switch_spk: {
			name: 'Switch Speakers to Channel',
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: CHANNEL_CHOICES }],
			callback: async (event) => {
				const ch = parseInt(event.options.channel)
				const auth = self.config.useAuth
					? { username: self.config.username, password: self.config.password }
					: undefined
				try {
					await sendCommand(self.config.host, { spk: ch }, auth)
					self.channelState.spk = ch
					self.setVariableValues({ spk_channel: ch })
					self.checkFeedbacks('channel_active')
				} catch (err) {
					self.log('error', `switch_spk failed: ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				}
			},
		},

		switch_usb1: {
			name: 'Switch USB 1 to Channel',
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: CHANNEL_CHOICES }],
			callback: async (event) => {
				const ch = parseInt(event.options.channel)
				const auth = self.config.useAuth
					? { username: self.config.username, password: self.config.password }
					: undefined
				try {
					await sendCommand(self.config.host, { usb1: ch }, auth)
					self.channelState.usb1 = ch
					self.setVariableValues({ usb1_channel: ch })
					self.checkFeedbacks('channel_active')
				} catch (err) {
					self.log('error', `switch_usb1 failed: ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				}
			},
		},

		switch_usb2: {
			name: 'Switch USB 2 to Channel',
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: CHANNEL_CHOICES }],
			callback: async (event) => {
				const ch = parseInt(event.options.channel)
				const auth = self.config.useAuth
					? { username: self.config.username, password: self.config.password }
					: undefined
				try {
					await sendCommand(self.config.host, { usb2: ch }, auth)
					self.channelState.usb2 = ch
					self.setVariableValues({ usb2_channel: ch })
					self.checkFeedbacks('channel_active')
				} catch (err) {
					self.log('error', `switch_usb2 failed: ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				}
			},
		},

		switch_all: {
			name: 'Switch All Peripherals to Channel',
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: CHANNEL_CHOICES }],
			callback: async (event) => {
				const ch = parseInt(event.options.channel)
				const auth = self.config.useAuth
					? { username: self.config.username, password: self.config.password }
					: undefined
				try {
					await sendCommand(self.config.host, { km: ch, spk: ch, usb1: ch, usb2: ch }, auth)
					self.channelState = { km: ch, spk: ch, usb1: ch, usb2: ch }
					self.setVariableValues({
						km_channel: ch,
						spk_channel: ch,
						usb1_channel: ch,
						usb2_channel: ch,
					})
					self.checkFeedbacks('channel_active')
				} catch (err) {
					self.log('error', `switch_all failed: ${err.message}`)
					self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				}
			},
		},
	})
}
```

- [ ] **Step 2: Add `updateActions()` to `src/main.js`**

Add to the top of the file (after existing requires):

```js
const UpdateActions = require('./actions')
```

Add `this.channelState` initialisation and `updateActions()` call to `init()`:

```js
async init(config) {
	this.config = config
	this.channelState = { km: 1, spk: 1, usb1: 1, usb2: 1 }
	this.updateActions()
	this.updateStatus(InstanceStatus.Ok)
}
```

Add the helper method at the bottom of the class:

```js
updateActions() {
	UpdateActions(this)
}
```

- [ ] **Step 3: Verify in Companion**

Restart the connection. Open a button editor. Confirm all 5 actions appear:

- "Switch Keyboard & Mouse to Channel"
- "Switch Speakers to Channel"
- "Switch USB 1 to Channel"
- "Switch USB 2 to Channel"
- "Switch All Peripherals to Channel"

With a real device, trigger "Switch All to Channel 2" — verify the device switches.

- [ ] **Step 4: Commit**

```bash
git add src/actions.js src/main.js
git commit -m "feat: add switch actions for all peripherals"
```

---

## Task 5: Variables

**Files:**

- Create: `src/variables.js`
- Modify: `src/main.js` (add `updateVariableDefinitions()` call and require)

- [ ] **Step 1: Create `src/variables.js`**

```js
'use strict'

module.exports = function (self) {
	self.setVariableDefinitions([
		{ variableId: 'km_channel', name: 'KM Active Channel' },
		{ variableId: 'spk_channel', name: 'Speaker Active Channel' },
		{ variableId: 'usb1_channel', name: 'USB1 Active Channel' },
		{ variableId: 'usb2_channel', name: 'USB2 Active Channel' },
	])

	// Set initial values from current state
	self.setVariableValues({
		km_channel: self.channelState.km,
		spk_channel: self.channelState.spk,
		usb1_channel: self.channelState.usb1,
		usb2_channel: self.channelState.usb2,
	})
}
```

- [ ] **Step 2: Wire into `src/main.js`**

Add require:

```js
const UpdateVariableDefinitions = require('./variables')
```

Add to `init()` after `updateActions()`:

```js
this.updateVariableDefinitions()
```

Add helper method:

```js
updateVariableDefinitions() {
	UpdateVariableDefinitions(this)
}
```

- [ ] **Step 3: Verify in Companion**

Restart connection. Open Variables panel. Confirm `km_channel`, `spk_channel`, `usb1_channel`, `usb2_channel` all show value `1`. Trigger "Switch KM to Channel 3" — confirm `km_channel` updates to `3`.

- [ ] **Step 4: Commit**

```bash
git add src/variables.js src/main.js
git commit -m "feat: add channel state variables"
```

---

## Task 6: Feedbacks

**Files:**

- Create: `src/feedbacks.js`
- Modify: `src/main.js` (add `updateFeedbacks()` call and require)

- [ ] **Step 1: Create `src/feedbacks.js`**

```js
'use strict'

const { combineRgb } = require('@companion-module/base')

const PERIPHERAL_CHOICES = [
	{ id: 'km', label: 'Keyboard & Mouse' },
	{ id: 'spk', label: 'Speakers' },
	{ id: 'usb1', label: 'USB 1' },
	{ id: 'usb2', label: 'USB 2' },
]

const CHANNEL_CHOICES = [
	{ id: '1', label: 'Channel 1' },
	{ id: '2', label: 'Channel 2' },
	{ id: '3', label: 'Channel 3' },
	{ id: '4', label: 'Channel 4' },
]

module.exports = function (self) {
	self.setFeedbackDefinitions({
		channel_active: {
			name: 'Peripheral on Channel',
			type: 'boolean',
			label: 'Change style when peripheral is on the selected channel',
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
					choices: PERIPHERAL_CHOICES,
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					default: '1',
					choices: CHANNEL_CHOICES,
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

- [ ] **Step 2: Wire into `src/main.js`**

Add require:

```js
const UpdateFeedbacks = require('./feedbacks')
```

Add to `init()`:

```js
this.updateFeedbacks()
```

Add helper method:

```js
updateFeedbacks() {
	UpdateFeedbacks(this)
}
```

- [ ] **Step 3: Verify in Companion**

Restart connection. Edit a button. Add feedback "Peripheral on Channel", set peripheral to "Keyboard & Mouse", channel to "Channel 1". Button should turn green (KM starts on channel 1). Trigger "Switch KM to Channel 2" — button reverts to default style. Switch back to channel 1 — button turns green again.

- [ ] **Step 4: Commit**

```bash
git add src/feedbacks.js src/main.js
git commit -m "feat: add channel_active boolean feedback"
```

---

## Task 7: Presets

**Files:**

- Create: `src/presets.js`
- Modify: `src/main.js` (add `updatePresets()` call and require)

- [ ] **Step 1: Create `src/presets.js`**

```js
'use strict'

module.exports = function (self) {
	const presets = {}

	const peripherals = [
		{ key: 'km', label: 'KM', actionId: 'switch_km', categoryLabel: 'KM Switch' },
		{ key: 'spk', label: 'SPK', actionId: 'switch_spk', categoryLabel: 'Speaker Switch' },
		{ key: 'usb1', label: 'USB1', actionId: 'switch_usb1', categoryLabel: 'USB 1 Switch' },
		{ key: 'usb2', label: 'USB2', actionId: 'switch_usb2', categoryLabel: 'USB 2 Switch' },
	]

	for (const p of peripherals) {
		for (let ch = 1; ch <= 4; ch++) {
			presets[`${p.key}_ch${ch}`] = {
				type: 'button',
				category: p.categoryLabel,
				name: `${p.label} → Ch ${ch}`,
				style: {
					text: `${p.label}\\nCh ${ch}`,
					size: '18',
					color: 0xffffff,
					bgcolor: 0x000000,
				},
				steps: [
					{
						down: [
							{
								actionId: p.actionId,
								options: { channel: String(ch) },
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'channel_active',
						options: {
							peripheral: p.key,
							channel: String(ch),
						},
					},
				],
			}
		}
	}

	// Switch All presets (one per channel)
	for (let ch = 1; ch <= 4; ch++) {
		presets[`all_ch${ch}`] = {
			type: 'button',
			category: 'Switch All',
			name: `All → Ch ${ch}`,
			style: {
				text: `ALL\\nCh ${ch}`,
				size: '18',
				color: 0xffffff,
				bgcolor: 0x000000,
			},
			steps: [
				{
					down: [
						{
							actionId: 'switch_all',
							options: { channel: String(ch) },
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	self.setPresetDefinitions(presets)
}
```

- [ ] **Step 2: Wire into `src/main.js`**

Add require:

```js
const UpdatePresets = require('./presets')
```

Add to `init()`:

```js
this.updatePresets()
```

Add helper method:

```js
updatePresets() {
	UpdatePresets(this)
}
```

- [ ] **Step 3: Verify in Companion**

Restart connection. Open the Presets panel for this connection. Confirm 4 categories appear: "KM Switch", "Speaker Switch", "USB 1 Switch", "USB 2 Switch", "Switch All". Drag a preset onto a button — confirm it has the correct action and feedback pre-configured.

- [ ] **Step 4: Commit**

```bash
git add src/presets.js src/main.js
git commit -m "feat: add presets for all peripherals and channels"
```

---

## Task 8: Main — Polling Loop & Full Lifecycle

**Files:**

- Modify: `src/main.js` (complete implementation)

- [ ] **Step 1: Replace `src/main.js` with complete implementation**

```js
'use strict'

const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const { sendCommand } = require('./api')
const http = require('http')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		this._pollTimer = null
		this.channelState = { km: 1, spk: 1, usb1: 1, usb2: 1 }
	}

	async init(config) {
		this.config = config
		this.channelState = { km: 1, spk: 1, usb1: 1, usb2: 1 }

		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		this.updatePresets()

		this.startPolling()
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
				tooltip: 'How often to check device state for externally triggered switches',
			},
			{
				type: 'checkbox',
				id: 'useAuth',
				label: 'Enable Authentication',
				width: 12,
				default: false,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 6,
				isVisible: (config) => !!config.useAuth,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
				isVisible: (config) => !!config.useAuth,
			},
		]
	}

	// --- Polling ---

	startPolling() {
		if (this._pollTimer) return
		const ms = (this.config.pollInterval || 5) * 1000
		// Poll immediately on connect, then on interval
		this.pollDevice()
		this._pollTimer = setInterval(() => this.pollDevice(), ms)
	}

	stopPolling() {
		if (this._pollTimer) {
			clearInterval(this._pollTimer)
			this._pollTimer = null
		}
	}

	/**
	 * Fetch the device status page and parse current channel state.
	 * The CCS-PRO HTML status page contains the current peripheral channels
	 * in a table. We use simple regex parsing — no HTML parser needed.
	 */
	pollDevice() {
		const options = {
			host: this.config.host,
			path: '/',
			method: 'GET',
			timeout: 4000,
		}

		if (this.config.useAuth && this.config.username) {
			const encoded = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
			options.headers = { Authorization: `Basic ${encoded}` }
		}

		const req = http.request(options, (res) => {
			let body = ''
			res.on('data', (chunk) => {
				body += chunk
			})
			res.on('end', () => {
				if (res.statusCode === 200) {
					this.parseStatusPage(body)
					this.updateStatus(InstanceStatus.Ok)
				} else if (res.statusCode === 401) {
					this.updateStatus(InstanceStatus.BadConfig, 'Authentication required — check username/password')
				} else {
					this.updateStatus(InstanceStatus.UnknownWarning, `HTTP ${res.statusCode}`)
				}
			})
		})

		req.on('error', (err) => {
			this.log('warn', `Poll failed: ${err.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		})
		req.on('timeout', () => {
			req.destroy(new Error('timeout'))
		})
		req.end()
	}

	/**
	 * Parse channel values from the CCS Manager status page HTML.
	 * The page contains a channel control table where KM, SPK, USB1, USB2
	 * values appear. We extract numeric channel values with regex.
	 * If parsing fails, state is left unchanged (optimistic values remain).
	 */
	parseStatusPage(html) {
		// The status page renders current channel selections as numeric values.
		// Match patterns like: value="3" ... name="km" or similar form fields.
		// This is a best-effort parse — adjust regex if the device firmware changes.
		const patterns = {
			km: /name=["']?km["']?[^>]*value=["']?(\d)["']?|value=["']?(\d)["']?[^>]*name=["']?km["']?/i,
			spk: /name=["']?spk["']?[^>]*value=["']?(\d)["']?|value=["']?(\d)["']?[^>]*name=["']?spk["']?/i,
			usb1: /name=["']?usb1["']?[^>]*value=["']?(\d)["']?|value=["']?(\d)["']?[^>]*name=["']?usb1["']?/i,
			usb2: /name=["']?usb2["']?[^>]*value=["']?(\d)["']?|value=["']?(\d)["']?[^>]*name=["']?usb2["']?/i,
		}

		let changed = false
		for (const [key, pattern] of Object.entries(patterns)) {
			const match = html.match(pattern)
			if (match) {
				const ch = parseInt(match[1] || match[2])
				if (ch >= 1 && ch <= 4 && this.channelState[key] !== ch) {
					this.channelState[key] = ch
					changed = true
				}
			}
		}

		if (changed) {
			this.setVariableValues({
				km_channel: this.channelState.km,
				spk_channel: this.channelState.spk,
				usb1_channel: this.channelState.usb1,
				usb2_channel: this.channelState.usb2,
			})
			this.checkFeedbacks('channel_active')
		}
	}

	// --- Wiring helpers ---

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

- [ ] **Step 2: Restart connection in Companion and verify**

Check the Companion log panel. On startup you should see:

- No errors
- Status shows OK (or ConnectionFailure if no device — both are expected)

If a real device is available:

- Confirm status goes to OK within one poll interval
- Switch a channel from the device front panel
- Confirm Companion variables update within `pollInterval` seconds

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "feat: complete main lifecycle with polling loop and status parsing"
```

---

## Task 9: HELP.md Documentation

**Files:**

- Modify: `companion/HELP.md`

- [ ] **Step 1: Write `companion/HELP.md`**

```markdown
## Adder CCS-PRO4

Control the Adder CCS-PRO4 KM switch from Bitfocus Companion over the local network.

### Requirements

- CCS-PRO4 must be connected to the same network as the Companion machine.
- The device's network port must be configured (default IP: `192.168.1.22`).
- If authentication is enabled on the device (CCS Manager → Security), enter credentials in the module config.

### Configuration

| Field                 | Description                                                                                                                    |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Device IP             | IP address of the CCS-PRO4 unit                                                                                                |
| Poll Interval         | How often (in seconds) Companion checks the device state. Catches external switches (front panel, hotkeys, other controllers). |
| Enable Authentication | Tick if you have enabled security in the CCS Manager.                                                                          |
| Username / Password   | Only required if authentication is enabled (default: `admin` / `password`).                                                    |

### Actions

| Action                             | Description                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Switch Keyboard & Mouse to Channel | Switches the KM peripheral to the chosen channel (1–4).                                      |
| Switch Speakers to Channel         | Switches the audio output to the chosen channel.                                             |
| Switch USB 1 to Channel            | Switches the USB1 peripheral port to the chosen channel.                                     |
| Switch USB 2 to Channel            | Switches the USB2 peripheral port to the chosen channel.                                     |
| Switch All Peripherals to Channel  | Switches all four peripherals (KM, SPK, USB1, USB2) to the same channel in a single command. |

### Feedbacks

**Peripheral on Channel** — turns a button green when a peripheral is actively on a selected channel.

Options:

- _Peripheral_ — which peripheral to monitor (KM, Speakers, USB1, USB2)
- _Channel_ — which channel to watch for (1–4)

### Variables

| Variable                        | Description                          |
| ------------------------------- | ------------------------------------ |
| `$(adder-ccs-pro:km_channel)`   | Current channel for Keyboard & Mouse |
| `$(adder-ccs-pro:spk_channel)`  | Current channel for Speakers         |
| `$(adder-ccs-pro:usb1_channel)` | Current channel for USB 1            |
| `$(adder-ccs-pro:usb2_channel)` | Current channel for USB 2            |

### Presets

Ready-made buttons are available in the Presets panel under the connection.
Categories: **KM Switch**, **Speaker Switch**, **USB 1 Switch**, **USB 2 Switch**, **Switch All**.
Each preset includes the switch action and the green active-channel feedback pre-configured.

### Notes

- The device has no push/event API. State is updated optimistically after each command and verified on each poll.
- Polling the device also detects channel changes made via the front panel buttons, hotkeys, or other control systems.
- The CCS-PRO4 supports up to 4 channels. The CCS-PRO8 variant (8 channels) is not supported by this module.
```

- [ ] **Step 2: Verify HELP.md appears in Companion**

In the Companion Connections panel, click the **?** icon next to the connection. Confirm the help page renders correctly with the tables and sections above.

- [ ] **Step 3: Final commit**

```bash
git add companion/HELP.md
git commit -m "docs: complete HELP.md for Companion UI"
```

---

## Done

All tasks complete. The module provides:

- 5 actions (km, spk, usb1, usb2, all)
- 1 parametric boolean feedback (peripheral + channel)
- 4 live variables
- 20 presets (16 peripheral/channel + 4 switch-all)
- HTTP polling loop for external state detection
- Optional HTTP Basic auth
- Full user-facing HELP.md

To package for distribution: `yarn package` → produces a `.tgz` in the project root.
