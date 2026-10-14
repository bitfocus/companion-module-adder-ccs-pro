module.exports = function (self) {
	self.setVariableDefinitions([
		{ variableId: 'psu1_state', name: 'PSU 1 Status'},
		{ variableId: 'psu2_state', name: 'PSU 2 Status'},
		{ variableId: 'temperature', name: 'Current Temperature'},
		{ variableId: 'km_channel', name: 'KM Active Channel' },
		{ variableId: 'spk_channel', name: 'Speaker Active Channel' },
		{ variableId: 'usb1_channel', name: 'USB1 Active Channel' },
		{ variableId: 'usb2_channel', name: 'USB2 Active Channel' },
	])

	// Set initial values from current state
	self.setVariableValues({
		psu1_state: self.deviceStatus.psu1,
		psu2_state: self.deviceStatus.psu2,
		temperature: self.deviceStatus.temp,
		km_channel: self.deviceStatus.km,
		spk_channel: self.deviceStatus.spk,
		usb1_channel: self.deviceStatus.usb1,
		usb2_channel: self.deviceStatus.usb2,
	})
	
}
