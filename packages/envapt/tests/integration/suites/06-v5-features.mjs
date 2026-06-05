import assert from 'node:assert/strict';
import process from 'node:process';

import { FIXTURE_PATH } from './_helpers.mjs';
import { EnvaptError, EnvaptErrorCodes, Envapter } from '../../../dist/node/index.mjs';

export default async function v5Features() {
    await strictMode();
    await debugMode();
    await syncProcessEnv();
    await requireHelper();
}

async function strictMode() {
    Envapter.strict = false;
    Envapter.envPaths = FIXTURE_PATH;
    assert.equal(Envapter.get('WHITESPACE_KEY'), '   ');

    Envapter.strict = true;
    try {
        assert.equal(Envapter.get('WHITESPACE_KEY'), undefined);
        assert.equal(Envapter.get('WHITESPACE_KEY', 'default'), 'default');
    } finally {
        Envapter.strict = false;
    }
}

async function debugMode() {
    Envapter.envPaths = FIXTURE_PATH;
    const captured = [];
    const orig = process.stderr.write.bind(process.stderr);
    process.stderr.write = (chunk) => {
        captured.push(typeof chunk === 'string' ? chunk : String(chunk));
        return true;
    };
    try {
        Envapter.debug = 'verbose';
        Envapter.envPaths = FIXTURE_PATH;
        const emitted = captured.some((line) => line.includes('[envapt]') && line.includes('cache cleared'));
        assert.ok(emitted, 'expected [envapt] cache-cleared line under verbose');
    } finally {
        process.stderr.write = orig;
        Envapter.debug = 'silent';
    }
}

async function syncProcessEnv() {
    Envapter.envPaths = FIXTURE_PATH;
    Reflect.deleteProperty(process.env, 'BASIC_KEY');
    try {
        Envapter.syncProcessEnv = false;
        assert.equal(Envapter.get('BASIC_KEY'), 'hello');
        assert.equal(process.env.BASIC_KEY, undefined);

        Envapter.syncProcessEnv = true;
        assert.equal(process.env.BASIC_KEY, 'hello');
    } finally {
        Envapter.syncProcessEnv = false;
        Reflect.deleteProperty(process.env, 'BASIC_KEY');
    }
}

async function requireHelper() {
    Envapter.envPaths = FIXTURE_PATH;
    Envapter.require('BASIC_KEY', 'NUMBER_KEY');

    assert.throws(
        () => Envapter.require('MISSING_REQUIRED_KEY'),
        (err) => err instanceof EnvaptError && err.code === EnvaptErrorCodes.MissingEnvValue
    );
}
