# Scale Arpeggiator Node

The Scale Arpeggiator Node generates a sequence of notes based on a selected musical scale. Unlike the Chord Arpeggiator, which arpeggiates the notes of a specific chord, this node creates melodic patterns from scales.

## Outputs

*   **Audio**: The audio output of the internal synthesizer.
*   **MIDI Out**: Outputs the MIDI note numbers of the arpeggiated sequence.

## Controls

*   **BPM**: Sets the tempo of the arpeggio in beats per minute.
*   **Note Duration**: The time value of each note in the arpeggio (e.g., 1/8, 1/16).
*   **Scale Type**: The musical scale to generate notes from (e.g., Major, Minor, Pentatonic).
*   **Root Note**: The starting note of the scale.
*   **Pattern**: The order in which the notes of the scale are played (e.g., Up, Down, Up-Down, Random).
*   **Octaves**: The number of octaves the arpeggio will span.
*   **Waveform**: The oscillator waveform for the internal synthesizer.
