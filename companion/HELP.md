## Adder CCS-PRO4

Control the Adder CCS-PRO4 KM switch from Bitfocus Companion over the local network.

### Requirements

- CCS-PRO4 must be connected to the same network as the Companion machine.
- The device's network port must be configured (default IP: `192.168.1.22`).
- If authentication is enabled on the device (CCS Manager → Security), enter credentials in the module config.

### Configuration

| Field | Description |
|-------|-------------|
| Device IP | IP address of the CCS-PRO4 unit |
| Poll Interval | How often (in seconds) Companion checks the device state. Catches external switches (front panel, hotkeys, other controllers). |
| Enable Authentication | Tick if you have enabled security in the CCS Manager. |
| Username / Password | Only required if authentication is enabled (default: `admin` / `password`). |

### Actions

| Action | Description |
|--------|-------------|
| Switch Keyboard & Mouse to Channel | Switches the KM peripheral to the chosen channel (1–4). |
| Switch Speakers to Channel | Switches the audio output to the chosen channel. |
| Switch USB 1 to Channel | Switches the USB1 peripheral port to the chosen channel. |
| Switch USB 2 to Channel | Switches the USB2 peripheral port to the chosen channel. |
| Switch All Peripherals to Channel | Switches all four peripherals (KM, SPK, USB1, USB2) to the same channel in a single command. |

### Feedbacks

**Peripheral on Channel** — turns a button green when a peripheral is actively on a selected channel.

Options:
- *Peripheral* — which peripheral to monitor (KM, Speakers, USB1, USB2)
- *Channel* — which channel to watch for (1–4)

### Variables

| Variable | Description |
|----------|-------------|
| `$(adder-ccs-pro:km_channel)` | Current channel for Keyboard & Mouse |
| `$(adder-ccs-pro:spk_channel)` | Current channel for Speakers |
| `$(adder-ccs-pro:usb1_channel)` | Current channel for USB 1 |
| `$(adder-ccs-pro:usb2_channel)` | Current channel for USB 2 |

### Presets

Ready-made buttons are available in the Presets panel under the connection.
Categories: **KM Switch**, **Speaker Switch**, **USB 1 Switch**, **USB 2 Switch**, **Switch All**.
Each preset includes the switch action and the green active-channel feedback pre-configured.

### Notes

- The device has no push/event API. State is updated optimistically after each command and verified on each poll.
- Polling the device also detects channel changes made via the front panel buttons, hotkeys, or other control systems.
- The CCS-PRO4 supports up to 4 channels. The CCS-PRO8 variant (8 channels) is not supported by this module.
