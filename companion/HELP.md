## Adder CCS-PRO

Control the Adder **CCS-PRO4** or **CCS-PRO8** KM switch from Bitfocus Companion over the local network. The same HTTP API is used; the PRO8 exposes channels 1–8 instead of 1–4.

### Requirements
* The switch must be on the same network as the Companion machine.
* The device's network port must be configured (default IP: `192.168.1.22`)sw.
* If authentication is enabled on the device (CCS Manager → Security), enter credentials in the module config.

---

### Configuration

| Field | Description |
| :--- | :--- |
| **Device IP** | IP address of the CCS-PRO unitsw. |
| **CCS-PRO Version** | Select **CCS-PRO4** or **CCS-PRO8** to set how many channel options appear in your module's actions and feedbackssw. |
| **Enable Authentication** | Tick if you have enabled security in the CCS Managersw. |
| **Username / Password** | Required if authentication is enabled (defaults to `admin` / `password` and are hidden when authentication is disabled)sw. |
| **Poll** | Tick to enable device polling, which allows Companion to keep feedback states updated. |
| **CCS-PRO Poll Interval in ms** | How often Companion checks the device state, defaulting to 5000 ms. This catches external switches from the front panel, hotkeys, or other controllers. |

---

### Actions

| Action | Description | Options |
| :--- | :--- | :--- |
| **Switch Channel** | Switches the peripheral routing to the chosen channel. | **Use the same channel for K/M, SPK, USB1, USB2:** When enabled, provides a single "Master Channel" dropdown to route all peripherals simultaneously.<br><br>**Switch KM / SPK / USB1 / USB2:** When the single channel option is disabled, provides independent checkboxes and dropdowns to route Keyboard/Mouse, Speaker, USB1, and USB2 to entirely different channels in a single action. |

---

### Feedbacks

| Feedback | Description | Options |
| :--- | :--- | :--- |
| **Peripheral Channel State** | Returns true if the specified peripheral is currently active on the selected channel. | **Peripheral:** All Peripherals, Keyboard/Mouse, Speaker, USB1, USB2.<br>**Channel:** The target channel number to watch for. |
| **Device Temperature Alert** | Returns true if the device's internal temperature meets your defined threshold. | **Comparison:** `<, <=, =, >=, >`.<br>**Target Temperature:** 0 to 150. |
| **Power Status Alert** | Returns true if the selected Power Supply Unit matches the targeted power state. | **Power Supply:** PSU 1, PSU 2.<br>**Target State:** Active, Inactive. |

---

## Variables

| Variable | Description |
| :--- | :--- |
| `$(adder-ccs-pro:psu1_state)` | Live status of Power Supply Unit 1 (e.g., Active, Inactive). |
| `$(adder-ccs-pro:psu2_state)` | Live status of Power Supply Unit 2 (e.g., Active, Inactive). |
| `$(adder-ccs-pro:temperature)` | Current internal temperature of the device. |
| `$(adder-ccs-pro:km_channel)` | Currently active channel for the Keyboard/Mouse. |
| `$(adder-ccs-pro:spk_channel)` | Currently active channel for the Speakers. |
| `$(adder-ccs-pro:usb1_channel)` | Currently active channel for USB 1. |
| `$(adder-ccs-pro:usb2_channel)` | Currently active channel for USB 2. |

### Presets

Ready-made buttons are dynamically generated based on your hardware version (1-4 or 1-8) and are available in the Presets panelsw.

| Category | Description |
| :--- | :--- |
| **Standard Channels** | Routes all peripherals to the listed channel and provides combined feedback. |
| **Keyboard/Mouse Switch** | Routes only the Keyboard/Mouse to the listed channel. |
| **Speaker Switch** | Routes only the Speakers to the listed channel. |
| **USB 1 Switch** | Routes only USB 1 to the listed channel. |
| **USB 2 Switch** | Routes only USB 2 to the listed channel. |

---

### Notes
* The device has no push/event API. 
* State is updated optimistically after each command and verified on each poll.
* Polling is required to detect channel changes from the front panel, hotkeys, or other controllers.