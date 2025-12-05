# Scale Arpeggiator Node

The **Scale Arpeggiator Node** generates melodic sequences of notes based on a selected musical scale and root note. Unlike the `ArpeggiatorNode` which works with specific chord shapes, this node creates patterns from a broader set of notes defined by a scale. It has its own internal synthesizer to produce sound.

## Inputs

| Name        | Description                                                                    |
| ----------- | ------------------------------------------------------------------------------ |
| **Clock In**  | A CV input that accepts a clock signal to drive the arpeggiator's timing externally. When connected, this overrides the internal BPM control. |

## Outputs

| Name         | Description                                                        |
| ------------ | ------------------------------------------------------------------ |
| **Audio**    | The audio output of the internal synthesizer.                      |
| **MIDI Out**   | Outputs the MIDI note numbers of the arpeggiated sequence, which can be used to control other nodes like the `ChordGeneratorNode`. |

## Controls

| Name            | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| **BPM**           | Sets the tempo of the arpeggio in beats per minute when no external clock is connected. |
| **Note Duration** | The time value of each note in the sequence (e.g., 1/8, 1/16).                 |
| **Scale Type**    | The musical scale to generate notes from (e.g., Major, Harmonic Minor, Pentatonic Minor). |
| **Root Note**     | The starting note (tonic) of the scale.                                        |
| **Pattern**       | The order in which the notes of the scale are played (e.g., Up, Down, Up-Down, Random). |
| **Octaves**       | The number of octaves the arpeggio will span.                                  |
| **Waveform**      | The oscillator waveform for the internal synthesizer.                          |
| **Envelope**      | A button to show/hide the ADSR envelope controls for the internal synthesizer. |
| **Attack (s)**    | The attack time of the envelope in seconds.                                    |
| **Decay (s)**     | The decay time of the envelope in seconds.                                     |
| **Sustain**       | The sustain level of the envelope (0-1).                                       |
| **Release (s)**   | The release time of the envelope in seconds.                                   |
