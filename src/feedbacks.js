const { combineRgb } = require('@companion-module/base')
const peripherals = [{id: "all", label: "All Peripherals"},{id: "km", label: "Keyboard/Mouse"}, {id: "spk", label: "Speaker"}, {id: "usb1", label: "USB1"}, {id:"usb2", label:"USB2"}]

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		active_channel: {
			name: 'Peripheral on Channel',
			type: 'boolean',
			label: 'Peripheral Channel State',
			defaultStyle: {
				bgcolor: combineRgb(0, 153, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					id: 'peripheral',
					type: 'dropdown',
					label: 'peripheral',
					choices: peripherals,
					default: peripherals[0].id
				},
				{
					id: 'channel',
					type: 'dropdown',
					label: 'Channel',
					choices: self.channelList,
					default: self.channelList[0] ? self.channelList[0].id : '1',
				}
			],
			callback: (feedback) => {
				if (parseInt(feedback.options.channel) > self.config.ccs_version) {
        			return false;
    }
				if(feedback.options.peripheral == "all"){
					return self.deviceStatus["km"] === feedback.options.channel && self.deviceStatus["spk"] === feedback.options.channel && self.deviceStatus["usb1"] === feedback.options.channel && self.deviceStatus["usb2"] === feedback.options.channel
				}
				return self.deviceStatus[feedback.options.peripheral] === feedback.options.channel;
			},
		},
		temperature_check: {
			type: 'boolean',
			name: 'Device Temperature Alert',
			options: [
				{
					type: 'dropdown',
					id: 'operator',
					label: 'Comparison',
					choices: [
						{ id: '<', label: '< (Less than)' },
						{ id: '<=', label: '<= (Less than or equal)' },
						{ id: '===', label: '= (Equal to)' },
						{ id: '>=', label: '>= (Greater than or equal)' },
						{ id: '>', label: '> (Greater than)' }
					],
					default: '>'
				},
				{
					type: 'number',
					id: 'targetValue',
					label: 'Target Temperature',
					default: 30,
					min: 0,
					max: 150
				}
			],
			callback: (feedback) => {
				// 1. The live hardware state
				const currentTemp = parseInt(self.deviceStatus.temp); 
				
				// 2. The user's typed value
				const target = parseInt(feedback.options.targetValue); 
				
				// 3. The mathematical map
				const math = {
					'<': (a, b) => a < b,
					'>': (a, b) => a > b,
					'===': (a, b) => a === b,
					'>=': (a, b) => a >= b,
					'<=': (a, b) => a <= b
				};

				// 4. Safely execute the dynamic string comparison
				return math[feedback.options.operator](currentTemp, target);
			}
	},
	power_status: {
		type: 'boolean',
		name: 'Power Status Alert',
		options: [
			{
				type: 'dropdown',
				id: 'power_supply',
				label: 'Power Supply',
				choices: [
					{id: "psu1", label: "PSU 1"},
					{id: "psu2", label: "PSU 2"}
				],
				default: "psu1"
			},
			{
            type: 'dropdown',
            id: 'state',
            label: 'Target State',
            choices: [
                { id: 'Active', label: 'Active' },
                { id: 'Inactive', label: 'Inactive' }
            ],
            default: 'Inactive'
        }
		],
		callback: (feedback) => {
			return self.deviceStatus[feedback.options.power_supply] === feedback.options.state;
		}
	}
	})
}
