const { request } = require('urllib');
const { InstanceStatus } = require('@companion-module/base')

const customOptions = {
    headers: {
        "User-Agent": "Buttons-CCS-Pro-Module",
        "Accept": "*/*",
        "Accept-Encoding": "identity" 
    }
};

async function changeChannel(self, km, spk, usb1, usb2, retry=0) {
    const url = new URL(`http://${self.config.host}/cgi-bin/channel`);

    const params = { km, spk, usb1, usb2};

    for (const [key,value] of Object.entries(params)){
        if (value != null){
            url.searchParams.append(key, value);
        }
    }
        
    try {
        // urllib handles the initial 401 and subsequent digest hash automatically
        const { data, res } = await request(url, {
            method: 'GET',
            digestAuth: `${self.config.username}:${self.config.password}`,
            headers: customOptions.headers,
            dataType: 'text', // Automatically converts the response buffer to a readable string
            timeout: [1000, 5000],
            retry: 0     // Good practice for Companion modules to prevent hanging
        });
        
        
        if (res.status >= 200 && res.status < 300) {
            self.log("debug", "Authentication Successful");
        } else {
            self.log("warn", `Authentication Failed or Server Error. Status: ${res.status}`);
        }
        
        
    } catch (error) {
        self.log("error", `Changing Channel failed: \n${error.message}`);
        
        throw error;
    }
}

async function getStatus(self) {
    const url = `http://${self.config.host}/status.json`;

    // 1. Create a hard JavaScript timeout promise
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Manual Timeout: Device took too long')), 2000);
    });

    try {
        // 2. Race the urllib request against the 2-second timer
        const { data, res } = await Promise.race([
            request(url, {
                method: 'GET',
                headers: customOptions.headers,
                dataType: 'json',
                retry: 0
            }),
            timeoutPromise
        ]);

        self.deviceStatus = Object.assign({}, ...data);

        if (self.currentStatus !== InstanceStatus.Ok) {
            self.log("info", `Status updated: ${JSON.stringify(self.deviceStatus)}`);
            self.updateStatus(InstanceStatus.Ok);
            self.currentStatus = InstanceStatus.Ok;
        }

    } catch (error) {
        if (self.currentStatus !== InstanceStatus.ConnectionFailure) {
            self.log("error", `get status error: ${error.message}`);
            self.updateStatus(InstanceStatus.ConnectionFailure);
            self.currentStatus = InstanceStatus.ConnectionFailure;
        }
    } finally{
        	self.setVariableValues({
                psu1_state: self.deviceStatus.psu1,
                psu2_state: self.deviceStatus.psu2,
                temperature: self.deviceStatus.temp,
                km_channel: self.deviceStatus.km,
                spk_channel: self.deviceStatus.spk,
                usb1_channel: self.deviceStatus.usb1,
                usb2_channel: self.deviceStatus.usb2,
            })
	
        	self.checkFeedbacks(...self.feedbackList)
    }
}

module.exports = { changeChannel, getStatus };