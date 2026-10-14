# companion-module-adder-ccs-pro (`adder-ccs-pro`)
See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

Bitfocus module for the Adder CCS-PRO4 / CCS-PRO8 KM switch (configure **Hardware** for 4 vs 8 channels).

**This module is provided "as is" without any warranties, express or implied. The developer assumes no responsibility for any issues, malfunctions, or damages that may arise from its use. By using this module, you acknowledge that you do so at your own risk. Compatibility with future versions of Bitfocus Companion and Adder CCS-PRO Hardware is not guaranteed.**

**Repository:** [github.com/bitfocus/companion-module-adder-ccs-pro](https://github.com/bitfocus/companion-module-adder-ccs-pro)

## Offline Setup

### Companion
1. `yarn install`
2. `yarn package`
3. This should create a file with the extension `.tgz`
4. In Companion, got to the `Manage Modules` tab.
5. Select `Import module package` and select the `.tgz` file.

### Buttons
#### Download Release Package
1. Download release package from https://github.com/bitfocus/companion-module-adder-ccs-pro/releases
2. In Buttons, in connections, import package.
3. Select downloaded package folder.

#### Build from Source
1. `yarn install`
2. `yarn package`
3. This should create a `pkg` folder.
4. In Buttons, in connections, import package.
5. Select the newly created `pkg` folder.

## Development

- Edit files in `src/`.
- Click the restart icon on the connection in the Companion UI to reload.
- `yarn format` to run Prettier.
- `yarn package` to zip for distribution.

## Device API

HTTP GET: `http://{ip}/cgi-bin/channel?km={1-4}&spk={1-4}&usb1={1-4}&usb2={1-4}`

Default device IP: `192.168.1.22`
