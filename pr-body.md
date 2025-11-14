Feature: Multi-key environment resolution, OC8 encoder/decoder, and SuperImage plugin

Summary

This PR introduces three sets of improvements designed to enhance flexibility, security, and developer experience in envapt:

1. Multi-Key Environment Variable Resolution

Adds support for resolving the first non-empty value from multiple environment variables:

Envapter.getUsing(['KEY1', 'KEY2', 'KEY3'], Converters.String)

Included:

- `getUsing()` and `getWith()` now accept `string | string[]`
- Internal resolver uses `getRawFrom()` for first-match semantics
- Supports all Envapt APIs (functional, instance, decorator)
- Fully backward-compatible

2. OC8 Encoder/Decoder (SuperImage)

Introduces a robust optional system for extracting secrets from PNG/NEZ files using the OC8 format:

OC8 format (per pixel):
- 3 data bytes (RGB)
- 1 CRC8 byte (A channel)

Included:

- Full OC8 encoder and decoder
- Automatic detection of `.png`, `.nez`, `.oc8`, `.superimg`
- High-reliability reconstruction even after minor compression
- Optional plugin API:
  `import { loadSuperEnv, makeSuperTransformer } from '@funeste38/envapt-superimg';`

3. Tests & Stability Improvements

Added:
- 270+ passing tests (mock, decode, error cases, PNG roundtrips)
- Coverage > 95%
- Updated bootstrap script
- No regressions in existing features

Status

- All features are backward-compatible
- Fully tested
- Ready for review

Co-authors
- funeste38 — primary implementer
- NexFlare_44 — technical co-author (design, validation, OC8 spec)
