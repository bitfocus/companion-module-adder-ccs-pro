'use strict'

const { combineRgb } = require('@companion-module/base')
const { maxChannel, buildChannelChoices } = require('./channel-range')

const PERIPHERAL_CHOICES = [
	{ id: 'km', label: 'Keyboard & Mouse' },
	{ id: 'spk', label: 'Speakers' },
	{ id: 'usb1', label: 'USB 1' },
	{ id: 'usb2', label: 'USB 2' },
]

module.exports = function (self) {
	const channelChoices = buildChannelChoices(maxChannel(self))

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
					choices: channelChoices,
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
