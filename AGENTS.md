# Workspace Design Guidelines for Audio

As an AI agent working on this project, follow these guidelines when creating or modifying audio workspaces to ensure they are stable, musical, and functional.

## Unified Voltage System
- All non-MIDI ports are functionally interchangeable ("voltage").
- Labels like `Audio In`, `Gate In`, `Freq CV` are suggestions for intended use.
- You can connect `Audio Out` to `Freq CV` for FM synthesis.

## Standard Patch Architecture
Every workspace should generally follow this flow:
1.  **Clocking**: A `Master Clock` node to provide rhythm.
2.  **Sound Generation**: `Tone Generator`, `Noise Generator`, `Sampler`, or `Sequencer`.
3.  **Shaping**: `Filter`, `VCA`, `ADSR Envelope`.
4.  **Effects**: `Delay`, `Reverb`, `Distortion`, `Bitcrusher`.
5.  **Output**: Always end with a `Master` node for audio monitoring.

## Common Sub-circuits (Best Practices)
- **Subtractive Synth**: `Tone Generator (Sawtooth)` -> `Filter (Lowpass)` controlled by an `ADSR Envelope`.
- **Mixing**: This system does NOT have a dedicated Mixer node. To mix signals, chain `VCA` nodes:
    - Signal A -> VCA 1 (Audio In)
    - Signal B -> VCA 2 (Audio In)
    - VCA 1 (Audio Out) -> VCA 2 (Audio In)
    - VCA 2 (Audio Out) -> Output
- **FM Pair**: `LFO (High Freq)` -> `Tone Generator (FM Input)`.

## Rhythmic Mini-notation
- Used in `Sequencer` and `Drum Machine` nodes.
- `~` for rests.
- `[ ]` for subdivisions.
- `< >` for alternations across cycles.
- `k`, `s`, `h` for Kick, Snare, Hi-hat in Drum Machine.

## Verification
- Use `scripts/workspace-tool.js decode <file>` to inspect existing workspaces.
- Use `scripts/workspace-tool.js encode <file>` to generate the Jekyll-compatible Markdown format.
- Run Playwright tests with `npx playwright test tests/workspaces.spec.js` to ensure your new workspace doesn't crash the editor.

## Node Construction Map
When adding new node types to the system, ensure they are registered in the `nodeConstructors` map inside the `editorFromJSON` function in `_layouts/default.html`.
