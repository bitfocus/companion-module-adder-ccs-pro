# companion-module-ccs-pro (`ccs-pro`)

Bitfocus Companion module for the Adder CCS-PRO4 / CCS-PRO8 KM switch (configure **Hardware** for 4 vs 8 channels).

## Setup

1. `yarn install`
2. Set the developer modules path in Companion Settings → Developer.
3. Symlink or copy this folder into that path.
4. Add a new connection in Companion and search for "Adder CCS-PRO".

## Development

- Edit files in `src/`.
- Click the restart icon on the connection in the Companion UI to reload.
- `yarn format` to run Prettier.
- `yarn package` to zip for distribution.

## Device API

HTTP GET: `http://{ip}/cgi-bin/channel?km={1-4}&spk={1-4}&usb1={1-4}&usb2={1-4}`

Default device IP: `192.168.1.22`
