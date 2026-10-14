const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')

const { getStatus } = require('./api');

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config;
		this.feedbackList = ["active_channel", "power_status", "temperature_check"]
		this.createChoiceLists();
		this.deviceStatus = {psu1: "Active", psu2: "Inactive", temp: 0, km: "1", spk: "1", usb1: "1", usb2: "1"};
		this.currentStatus = InstanceStatus.Connecting;



		if (this.config.poll || this.currentStatus != InstanceStatus.Ok){
			this.startPolling();
		}


		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updatePresets()
		this.updateVariableDefinitions() // export variable definitions
		await getStatus(this);
	}
	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		const versionChanged = config.ccs_version!=this.config.ccs_version
		this.config = config;
		if (versionChanged){
			this.createChoiceLists();
		}

		this.stopPolling();
		await getStatus(this);
		if (this.config.poll || this.currentStatus != InstanceStatus.Ok){
			this.startPolling();
		}
	}

	createChoiceLists(){
		let temp = [];
		for(var i = 1; i < this.config.ccs_version+1; i++){
			temp.push({id: i.toString(), label: `Channel ${i}`});
		}
		this.channelList = temp;
		this.updateActions();
		this.updateFeedbacks();
		this.updatePresets();
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Device IP',
				width: 8,
				regex: Regex.IP,
				default: "192.168.1.22"
			},
			{
				type: 'dropdown',
				id: 'ccs_version',
				label: 'CCS-PRO Version',
				choices: [{id: 4, label: "CCS-PRO4"}, {id: 8, label: "CCS-PRO8"}],
				default: 4
			},
			{
				id: 'useAuthentication',
				label: 'Enable Authentication',
				type: 'checkbox',
				default: false,

			},
			{
				type: 'textinput',
				id: 'username',
				label: 'username',
				width: 6,
				default: "admin",
				isVisibleExpression: '$(options:useAuthentication) === true'
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'password',
				width: 6,
				default: "password",
				isVisibleExpression: '$(options:useAuthentication) === true'
			},
			{
				type: 'number',
				id: 'pollInterval',
				tooltip: "Poll CCS-PRO for channel status",
				label: "CCS-PRO Poll Interval in ms",
				width: 4,
				min: 1000,
				default: 5000
			},
			{
				type: 'checkbox',
				id: 'poll',
				label: 'Poll',
				tooltip: "Enable device polling. Allows for keeping feedback updated.",
				width: 2,
				default: false
			}
		]
	}

	startPolling() {
        // Always clean up existing loops first
        this.stopPolling();

        if (this.config.pollInterval && (this.config.poll || this.currentStatus !== InstanceStatus.Ok)) {
            this.isPolling = true; // Use a boolean flag to control the loop
            this.pollLoop();
			this.log("info", "Polling Started")
        }
    }

    stopPolling() {
        this.isPolling = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
			this.log("info", "polling stopped")
        }

    }

    // The recursive loop
    async pollLoop() {
        // Safety check to ensure we don't fire if polling was stopped
        if (!this.isPolling) return;



        // 1. Await the API call. It will completely block here until success or failure.
        await getStatus(this);
	

        // 2. Only schedule the NEXT run after the previous one finishes.
        // This makes overlapping requests literally impossible.
        if (this.isPolling) {
            this.pollTimer = setTimeout(() => {
                this.pollLoop();
            }, this.config.pollInterval);
        }
    }

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
	updatePresets(){
		UpdatePresets(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
