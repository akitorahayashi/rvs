# VOICEVOX API Boundary

## Runtime

`rvs` uses VOICEVOX engine `0.25.0` through the Docker image
`voicevox/voicevox_engine:cpu-ubuntu22.04-0.25.0`.

The default engine URL is `http://127.0.0.1:50021`. The
`RVS_VOICEVOX_ENGINE_URL` environment variable overrides this URL. Configured
URLs are trimmed and must use `http` or `https`.

## Request Flow

Narration synthesis uses two VOICEVOX endpoints.

1. `POST /audio_query`
2. `POST /synthesis`

`/audio_query` receives the narration text and speaker ID as query parameters.
The request body is an empty JSON object.

```http
POST /audio_query?text=<text>&speaker=<speakerId>
Content-Type: application/json

{}
```

`/synthesis` receives the speaker ID as a query parameter and the adjusted audio
query payload as JSON.

```http
POST /synthesis?speaker=<speakerId>
Content-Type: application/json
```

The synthesis response body is treated as WAV bytes. `rvs` converts those bytes
to MP3 before writing project audio files.

## Audio Query Payload

VOICEVOX `0.25.0` returns a JSON object from `/audio_query`. A representative
response contains these top-level fields:

* `accent_phrases`
* `speedScale`
* `pitchScale`
* `intonationScale`
* `volumeScale`
* `prePhonemeLength`
* `postPhonemeLength`
* `pauseLength`
* `pauseLengthScale`
* `outputSamplingRate`
* `outputStereo`
* `kana`

`rvs` preserves the full object returned by `/audio_query`, including unknown
fields. Before sending `/synthesis`, it overlays the local narration profile
values for:

* `speedScale`
* `pitchScale`
* `intonationScale`
* `volumeScale`
* `prePhonemeLength`
* `postPhonemeLength`

This keeps engine-specific fields intact while making local narration tuning
explicit.

## Default Narration Profile

The default narration profile is:

* `speakerId`: `2`
* `speedScale`: `1.15`
* `pitchScale`: `0.0`
* `intonationScale`: `1.0`
* `volumeScale`: `1.0`
* `prePhonemeLength`: `0.0`
* `postPhonemeLength`: `0.0`

Profile values are validated before synthesis. Numeric audio parameters must be
finite numbers. `speakerId` must be a non-negative integer.

## Validation Boundary

`rvs` validates the API boundary it owns:

* Engine URLs are non-empty HTTP or HTTPS URLs.
* VOICEVOX request failures are converted to `MediaContractError`.
* Non-2xx `/audio_query` and `/synthesis` responses are surfaced as HTTP
  failures.
* `/audio_query` JSON parse failures are distinct from response shape failures.
* `/audio_query` payloads must be JSON objects.
* Unknown `/audio_query` properties are allowed and preserved.

`rvs` does not validate the full VOICEVOX OpenAPI schema. Full field validation
belongs in this boundary only when the application starts reading or mutating
additional fields directly.
