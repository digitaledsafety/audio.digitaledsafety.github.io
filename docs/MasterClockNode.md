# Master Clock Node

The Master Clock Node is a central timing source for the entire patch. It generates a stable tempo that can be used to synchronize other time-sensitive nodes like sequencers and arpeggiators.

## Outputs

*   **Clock Out**: A clock signal that outputs pulses at a high resolution (typically 24 pulses per quarter note).

## Controls

*   **BPM**: Sets the tempo in beats per minute for the entire patch.
*   **Start/Stop**: Toggles the clock on and off.
*   **Clock Pulse**: A visual indicator that blinks with each beat to provide feedback on the current tempo.
