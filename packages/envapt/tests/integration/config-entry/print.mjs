import '../../../dist/node/config.mjs';

import process from 'node:process';

process.stdout.write(JSON.stringify([process.env.CONFIG_KEY_A, process.env.CONFIG_KEY_B]));
