## Adder CCS-PRO

Control the Adder **CCS-PRO4** or **CCS-PRO8** KM switch from Bitfocus Companion over the local network. The same HTTP API is used; the PRO8 exposes channels **1–8** instead of **1–4**.

### Requirements

- The switch must be on the same network as the Companion machine.
- The device's network port must be configured (default IP: `192.168.1.22`).
- If authentication is enabled on the device (CCS Manager → Security), enter credentials in the module config.

### Configuration

| Field                 | Description                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Device IP             | IP address of the CCS-PRO unit                                                                                                    |
| Hardware              | **CCS-PRO4 (4 channels)** or **CCS-PRO8 (8 channels)** — sets how many channel options appear in actions, feedbacks, and presets. |
| Poll Interval         | How often (in seconds) Companion checks the device state. Catches external switches (front panel, hotkeys, other controllers).    |
| Enable Authentication | Tick if you have enabled security in the CCS Manager.                                                                             |
| Username / Password   | Only required if authentication is enabled (default: `admin` / `password`).                                                       |

### Actions

| Action                             | Description                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Switch Keyboard & Mouse to Channel | Switches the KM peripheral to the chosen channel (1–4 or 1–8 per **Hardware**).              |
| Switch Speakers to Channel         | Switches the audio output to the chosen channel.                                             |
| Switch USB 1 to Channel            | Switches the USB1 peripheral port to the chosen channel.                                     |
| Switch USB 2 to Channel            | Switches the USB2 peripheral port to the chosen channel.                                     |
| Switch All Peripherals to Channel  | Switches all four peripherals (KM, SPK, USB1, USB2) to the same channel in a single command. |

### Feedbacks

**Peripheral on Channel** — turns a button green when a peripheral is actively on a selected channel.

Options:

- _Peripheral_ — which peripheral to monitor (KM, Speakers, USB1, USB2)
- _Channel_ — which channel to watch for (1–4 or 1–8, matching **Hardware**)

### Variables

| Variable                  | Description                          |
| ------------------------- | ------------------------------------ |
| `$(ccs-pro:km_channel)`   | Current channel for Keyboard & Mouse |
| `$(ccs-pro:spk_channel)`  | Current channel for Speakers         |
| `$(ccs-pro:usb1_channel)` | Current channel for USB 1            |
| `$(ccs-pro:usb2_channel)` | Current channel for USB 2            |

### Presets

Ready-made buttons are available in the Presets panel under the connection.
Categories: **KM Switch**, **Speaker Switch**, **USB 1 Switch**, **USB 2 Switch**, **Switch All**.
The number of channel presets matches **Hardware** (4 or 8 per peripheral, plus Switch All).

### Notes

- The device has no push/event API. State is updated optimistically after each command and verified on each poll.
- Polling also detects channel changes from the front panel, hotkeys, or other controllers.
- After changing **Hardware**, restart the connection or reload the page so action/feedback options refresh.
