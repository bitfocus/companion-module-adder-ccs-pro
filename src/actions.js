const {changeChannel, getStatus } = require('./api');

module.exports = function (self) {
	self.setActionDefinitions({
		switch_channel: {
			name: 'Switch Channel',
			options: [
				{
					id: 'useSingleChannel',
					type: 'checkbox',
					label: "Use the same channel for K/M, SPK, USB1, USB2",
					default: true,

				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Master Channel',
					choices: self.channelList,
					default: self.channelList[0] ? self.channelList[0].id : '1',
					isVisibleExpression: '$(options:useSingleChannel) === true'
				},
				{
					id: 'switchKM',
					type: 'checkbox',
					label: "Switch KM",
					default: true,
					isVisibleExpression: '$(options:useSingleChannel) === false'

				},
				{
					id: 'keyboard_mouse',
					type: 'dropdown',
					label: 'Keyboard/Mouse Channel',
					choices: self.channelList,
					default: self.channelList[0] ? self.channelList[0].id : '1',
					isVisibleExpression: '$(options:useSingleChannel) === false  && $(options:switchKM) === true'
				},
				{
					id: 'switchSPK',
					type: 'checkbox',
					label: "Switch Speaker",
					default: true,
					isVisibleExpression: '$(options:useSingleChannel) === false'

				},	
				{
					id: 'speaker',
					type: 'dropdown',
					label: 'Speaker Channel',
					choices: self.channelList,
					default: self.channelList[0] ? self.channelList[0].id : '1',
					isVisibleExpression: '$(options:useSingleChannel) === false && $(options:switchSPK) === true'
				},
				{
					id: 'switchUSB1',
					type: 'checkbox',
					label: "Switch USB1",
					default: true,
					isVisibleExpression: '$(options:useSingleChannel) === false'

				},			
				{
					id: 'USB1',
					type: 'dropdown',
					label: 'USB1 Channel',
					choices: self.channelList,
					default: self.channelList[0] ? self.channelList[0].id : '1',
					isVisibleExpression: '$(options:useSingleChannel) === false && $(options:switchUSB1) === true'
				},
				{
					id: 'switchUSB2',
					type: 'checkbox',
					label: "Switch USB2",
					default: true,
					isVisibleExpression: '$(options:useSingleChannel) === false'

				},
				{
					id: 'USB2',
					type: 'dropdown',
					label: 'USB2 Channel',
					choices: self.channelList,
					default: self.channelList[0] ? self.channelList[0].id : '1',
					isVisibleExpression: '$(options:useSingleChannel) === false && $(options:switchUSB2) === true'
				},
			],
			callback: async (action) => {
				let channel = parseInt(action.options.channel);
        
				if (channel > self.config.ccs_version) {
					self.log('warn', `Action aborted: Channel ${channel} is not valid for a ${self.config.ccs_version}-port switch.`);
					return; 
				}
				if (action.options.useSingleChannel) {
					let channel = action.options.channel; 
					let success = await changeChannel(self, channel, channel, channel, channel);
				} else {
					let success = await changeChannel(
						self, 
						action.options.switchKM ? action.options.keyboard_mouse : null, 
						action.options.switchSPK ? action.options.speaker : null, 
						action.options.switchUSB1 ? action.options.USB1 : null, 
						action.options.switchUSB2 ? action.options.USB2 : null
					);
				}
				getStatus(self);
			},
		},
	})
}
