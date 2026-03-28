'use strict'

/**
 * Max channel count from connection config (CCS-PRO4 → 4, CCS-PRO8 → 8).
 * @param {object} self - module instance with .config
 * @returns {4|8}
 */
function maxChannel(self) {
	const v = parseInt(self.config?.maxChannels, 10)
	return v === 8 ? 8 : 4
}

/**
 * Dropdown choices for Companion action/feedback options.
 * @param {4|8} max
 * @returns {Array<{ id: string, label: string }>}
 */
function buildChannelChoices(max) {
	const choices = []
	for (let i = 1; i <= max; i++) {
		choices.push({ id: String(i), label: `Channel ${i}` })
	}
	return choices
}

module.exports = { maxChannel, buildChannelChoices }
