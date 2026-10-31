# K — Feature flags and error reporting

Shared platform services in the playbook: nothing let the team switch a
feature off without a code change, and nothing reported errors from users'
phones. K adds both, flags first.

## Slices

| Slice | What | New LOC (est.) |
| --- | --- | ---: |
| K1 Feature flags | Flags with build values and per-phone overrides | 250–400 |
| K2 Error reporting | Catch crashes, keep a log, send to a reporting service | needs a decision, see below |

## K1 — Feature flags

`src/services/flags`. A flag's value comes from, in order:

1. **A device override**, set on *Feature flags* in Labs (`/labs/flags`) and
   kept on that phone only. For testing: QA can switch a feature off on one
   phone without a new build. Per phone, not per wedding, so it is kept in
   plain storage rather than the workspace and never syncs.
2. **The build**, from `EXPO_PUBLIC_FLAGS`, for example
   `EXPO_PUBLIC_FLAGS="liveMode=off,visionPhotos=on"` in the build's
   environment. Unknown keys and values are skipped (with a warning in
   development), so a typo cannot switch on something else.
3. **The flag's default** in `FLAGS`.

Screens use `useFlag('liveMode')`, other code `isEnabled('liveMode')`. An
unknown key throws in development and reads as off in production.

**Flags so far** (all on by default):

| Flag | Turns off |
| --- | --- |
| `liveMode` | The live card on the run of show (I1) |
| `runOfShowCues` | Cues before run-of-show items (I2) |
| `visionPhotos` | Adding photos to vision ideas (J1); photos already added still show |

**Adding a flag:** add it to `FLAGS` with a title, a description and a
default, then read it where the feature starts. Remove the flag, and the
branches it guarded, once the feature is settled.

Overrides load just after start, so a flag overridden on a phone can flip
on the first screen; build values and defaults are known at once.

**Not in this slice:** remote flags, to turn a feature off for everyone
without a release. They need a flags endpoint on the server (or a service
such as PostHog or LaunchDarkly); `resolveFlag` is where they would slot in,
between the device override and the build.

Status: K1 done on `feature/feature-flags`.

## K2 — Error reporting (not started)

Needs a team decision first: which service (Sentry is the usual choice for
Expo, with `@sentry/react-native` and its config plugin), who owns the
account, and what may leave the phone. Wedding plans hold guests' names,
phone numbers and dietary needs, so reports should carry the error and the
screen, never the plan, and the privacy policy needs a line about it.
