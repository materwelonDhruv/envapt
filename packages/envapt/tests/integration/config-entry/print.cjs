require('../../../dist/node/config.cjs');

const process = require('node:process');

process.stdout.write(JSON.stringify([process.env.CONFIG_KEY_A, process.env.CONFIG_KEY_B]));
