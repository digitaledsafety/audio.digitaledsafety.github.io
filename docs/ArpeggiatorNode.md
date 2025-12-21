# Arpeggiator Node

The Arpeggiator Node can be used to create arpeggios.

## Inputs

| Name             | Description                              |
| ---------------- | ---------------------------------------- |
| **Clock In**     | A CV input that accepts a clock signal to drive the arpeggiator's timing externally. |
| **MIDI In**      | A MIDI input to receive note data, which will override the root note setting. |
| **Transpose CV** | Modulates the root note of the arpeggio. Follows the 1V/Octave standard (+1V = +12 semitones). |

## Outputs

| Name       | Description                              |
| ---------- | ---------------------------------------- |
| **Audio**  | The audio output of the arpeggiator's internal synthesizer. |
| **MIDI Out** | Outputs the MIDI notes being played by the arpeggiator. |

## Controls

| Name            | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| **BPM**           | The tempo of the arpeggiator in beats per minute.                              |
| **Note Duration** | The duration of each note in the arpeggio.                                     |
| **Chord Type**    | The type of chord to arpeggiate.                                               |
| **Root Note**     | The root note of the arpeggio.                                                 |
| **Pattern**       | The pattern of the arpeggio.                                                   |
| **Octaves**       | The number of octaves to span.                                                 |
| **Waveform**      | The waveform of the oscillator. Can be one of `sine`, `square`, `sawtooth`, or `triangle`. |
| **Envelope**      | A button to show/hide the ADSR envelope controls for the internal synthesizer. |
| **Attack (s)**    | The attack time of the envelope in seconds.                                    |
| **Decay (s)**     | The decay time of the envelope in seconds.                                     |
| **Sustain**       | The sustain level of the envelope (0-1).                                       |
| **Release (s)**   | The release time of the envelope in seconds.                                   |
