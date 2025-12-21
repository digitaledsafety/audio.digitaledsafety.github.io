# Chord Generator Node

The **Chord Generator Node** produces a chord consisting of multiple simultaneous notes. It has its own internal bank of oscillators to generate sound. This node is useful for creating harmonic textures and pads.

## Inputs

| Name             | Description                                                                    |
| ---------------- | ------------------------------------------------------------------------------ |
| **MIDI In**      | A MIDI input that allows an external source (like a `SequencerNode` or `ArpeggiatorNode`) to set the root note of the chord dynamically. |
| **Transpose CV** | Modulates the root note of the chord. Follows the 1V/Octave standard (+1V = +12 semitones). |

## Outputs

| Name      | Description                               |
| --------- | ----------------------------------------- |
| **Audio** | The audio output of the internal oscillators. |

## Controls

| Name            | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| **Chord Type**    | The musical type of the chord to be generated (e.g., Major Triad, Minor 7th, Sus4). |
| **Root Note**     | The fundamental note upon which the chord is built.                            |
| **Octave Offset** | Transposes the entire chord up or down by a specified number of octaves.     |
| **Waveform**      | The oscillator waveform used for all notes in the chord.                       |
