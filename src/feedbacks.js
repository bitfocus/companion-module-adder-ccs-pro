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
