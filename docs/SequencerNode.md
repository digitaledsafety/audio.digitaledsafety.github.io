# Sequencer Node

The Sequencer Node can be used to create musical sequences.

## Inputs

| Name             | Description                              |
| ---------------- | ---------------------------------------- |
| **Clock In**     | A CV input that accepts a clock signal to drive the sequencer's timing externally. |
| **Transpose CV** | Modulates the root note of the sequence. Follows the 1V/Octave standard (+1V = +12 semitones). |

## Outputs

| Name       | Description                              |
| ---------- | ---------------------------------------- |
| **Audio**  | The audio output of the sequencer's internal synthesizer. |
| **MIDI Out** | Outputs the MIDI notes being played by the sequencer. |

## Controls

| Name            | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| **BPM**           | The tempo of the sequencer in beats per minute.                                |
| **Note Duration** | The duration of each note in the sequence.                                     |
| **Sequence**      | The musical sequence to play. |
| **Waveform**      | The waveform of the oscillator. Can be one of `sine`, `square`, `sawtooth`, or `triangle`. |
| **Envelope**      | A button to show/hide the ADSR envelope controls for the internal synthesizer. |
| **Attack (s)**    | The attack time of the envelope in seconds.                                    |
| **Decay (s)**     | The decay time of the envelope in seconds.                                     |
| **Sustain**       | The sustain level of the envelope (0-1).                                       |
| **Release (s)**   | The release time of the envelope in seconds.                                   |
