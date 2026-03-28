'use strict'

const { maxChannel } = require('./channel-range')

module.exports = function (self) {
	const presets = {}
	const maxCh = maxChannel(self)

	const peripherals = [
		{ key: 'km', label: 'KM', actionId: 'switch_km', categoryLabel: 'KM Switch' },
		{ key: 'spk', label: 'SPK', actionId: 'switch_spk', categoryLabel: 'Speaker Switch' },
		{ key: 'usb1', label: 'USB1', actionId: 'switch_usb1', categoryLabel: 'USB 1 Switch' },
		{ key: 'usb2', label: 'USB2', actionId: 'switch_usb2', categoryLabel: 'USB 2 Switch' },
	]

	for (const p of peripherals) {
		for (let ch = 1; ch <= maxCh; ch++) {
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
	for (let ch = 1; ch <= maxCh; ch++) {
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
