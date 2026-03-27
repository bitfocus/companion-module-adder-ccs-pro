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
