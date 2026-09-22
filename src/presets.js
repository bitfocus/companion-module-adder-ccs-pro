'use strict'

module.exports = function (self) {
	const presets = {}
	const maxCh = self.config.ccs_version

	const peripherals = [
        { 
            key: 'channel', label: "Channel", categoryLabel: 'Standard Channels', 
            targetDropdown: 'channel', 
            options: { useSingleChannel: true } 
        },
        { 
            key: 'km', label: 'KM', categoryLabel: 'Keyboard/Mouse Switch', 
            targetDropdown: 'keyboard_mouse', 
            options: { useSingleChannel: false, switchKM: true, switchSPK: false, switchUSB1: false, switchUSB2: false } 
        },
        { 
            key: 'spk', label: 'SPK', categoryLabel: 'Speaker Switch', 
            targetDropdown: 'speaker', 
            options: { useSingleChannel: false, switchKM: false, switchSPK: true, switchUSB1: false, switchUSB2: false } 
        },
        { 
            key: 'usb1', label: 'USB1', categoryLabel: 'USB 1 Switch', 
            targetDropdown: 'USB1', 
            options: { useSingleChannel: false, switchKM: false, switchSPK: false, switchUSB1: true, switchUSB2: false } 
        },
        { 
            key: 'usb2', label: 'USB2', categoryLabel: 'USB 2 Switch', 
            targetDropdown: 'USB2', 
            options: { useSingleChannel: false, switchKM: false, switchSPK: false, switchUSB1: false, switchUSB2: true } 
        },
    ]

	for (const p of peripherals) {
		for (let ch = 1; ch <= maxCh; ch++) {
			presets[`${p.key}_ch${ch}`] = {
				type: 'button',
				category: p.categoryLabel,
				name: `${p.label} → Ch ${ch}`,
				style: {
					text: `${p.label}\\nCh ${ch}`,
					size: 'auto',
					color: 0xffffff,
					bgcolor: 0x000000,
				},
				steps: [
					{
						down: [
							{
								actionId: "switch_channel",
								options: { [p.targetDropdown]: String(ch), ...p.options },
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'active_channel',
						options: {
							peripheral: p.key == "channel" ? "all" : p.key,
							channel: String(ch),
						},
                        style: {
                                    bgcolor: 0x00CC00, 
                                    color: 0xffffff,
                                }
					},
				],
			}
		}
	}

	
	self.setPresetDefinitions(presets)
}
