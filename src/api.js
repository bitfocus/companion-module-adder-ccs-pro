'use strict'

const http = require('http')

/**
 * Send a channel-switch command to the CCS-PRO device.
 *
 * @param {string} host   - device IP address (e.g. '192.168.1.22')
 * @param {object} params - peripheral→channel map, e.g. { km: 2, spk: 3 }
 * @param {object} [auth] - optional { username: string, password: string }
 * @returns {Promise<void>} resolves on HTTP 200, rejects otherwise
 */
function sendCommand(host, params, auth) {
	return new Promise((resolve, reject) => {
		const query = Object.entries(params)
			.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
			.join('&')
		const path = `/cgi-bin/channel?${query}`

		const options = {
			host,
			path,
			method: 'GET',
			timeout: 5000,
		}

		if (auth && auth.username) {
			const encoded = Buffer.from(`${auth.username}:${auth.password}`).toString('base64')
			options.headers = { Authorization: `Basic ${encoded}` }
		}

		const req = http.request(options, (res) => {
			res.resume() // drain response body so the socket is freed
			if (res.statusCode === 200) {
				resolve()
			} else {
				reject(new Error(`HTTP ${res.statusCode}`))
			}
		})

		req.on('error', reject)
		req.on('timeout', () => {
			req.destroy(new Error('Request timed out'))
		})
		req.end()
	})
}

module.exports = { sendCommand }
