'use strict'

const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts      = require('./upgrades')
const UpdateActions       = require('./actions')
const UpdateFeedbacks     = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets       = require('./presets')
const { sendCommand }     = require('./api')
const http                = require('http')

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
			host:    this.config.host,
			path:    '/',
			method:  'GET',
			timeout: 4000,
		}

		if (this.config.useAuth && this.config.username) {
			const encoded = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')
			options.headers = { Authorization: `Basic ${encoded}` }
		}

		const req = http.request(options, (res) => {
			let body = ''
			res.on('data', (chunk) => { body += chunk })
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
			km:   /name=["']?km["']?[^>]*value=["']?(\d)["']?|value=["']?(\d)["']?[^>]*name=["']?km["']?/i,
			spk:  /name=["']?spk["']?[^>]*value=["']?(\d)["']?|value=["']?(\d)["']?[^>]*name=["']?spk["']?/i,
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
				km_channel:   this.channelState.km,
				spk_channel:  this.channelState.spk,
				usb1_channel: this.channelState.usb1,
				usb2_channel: this.channelState.usb2,
			})
			this.checkFeedbacks('channel_active')
		}
	}

	// --- Wiring helpers ---

	updateActions()             { UpdateActions(this) }
	updateFeedbacks()           { UpdateFeedbacks(this) }
	updateVariableDefinitions() { UpdateVariableDefinitions(this) }
	updatePresets()             { UpdatePresets(this) }
}

runEntrypoint(ModuleInstance, UpgradeScripts)
