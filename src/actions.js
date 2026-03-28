'use strict'

const { InstanceStatus } = require('@companion-module/base')
const { sendCommand } = require('./api')
const { maxChannel, buildChannelChoices } = require('./channel-range')

module.exports = function (self) {
	const max = maxChannel(self)
	const channelChoices = buildChannelChoices(max)

	self.setActionDefinitions({
		switch_km: {
			name: 'Switch Keyboard & Mouse to Channel',
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: channelChoices }],
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
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: channelChoices }],
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
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: channelChoices }],
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
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: channelChoices }],
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
			options: [{ id: 'channel', type: 'dropdown', label: 'Channel', default: '1', choices: channelChoices }],
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
