# Drum Machine Node

The Drum Machine node is a sequencer specifically designed for creating drum patterns. It uses a simple mini-notation to define the sequence of drum hits and generates synthesized drum sounds.

## Mini-Notation

The drum machine uses the same powerful mini-notation parser as the `Sequencer` node, but with a focus on drum-specific sounds:

*   `k`: A synthesized kick drum.
*   `s`: A synthesized snare drum.
*   `h`: A synthesized hi-hat.
*   `~`: Represents a rest (silence).

Events are separated by spaces. For example, a classic four-on-the-floor beat would be written as: `k h s h`

## Inputs

*   **Clock In**: An external clock signal can be connected to drive the drum machine's tempo, overriding the internal BPM setting. This is useful for synchronizing multiple sequencers or arpeggiators.

## Outputs

*   **Audio**: The main audio output of the synthesized drum sounds.

## Controls

*   **BPM**: Sets the tempo of the drum machine in beats per minute. This control is only active when no external clock is connected.
    *   Range: 60 to 240 BPM
*   **Note Duration**: Determines the time division for each step in the sequence (e.g., 1/16 for sixteenth notes).
    *   Values: `1`, `1/2`, `1/4`, `1/8`, `1/16`, `1/32`, `1/64`, `1/128`
*   **Sequence**: A text field where you enter the mini-notation for your drum pattern.

## Usage

1.  Add a **Drum Machine** node from the "Add Node" menu.
2.  Connect its **Audio** output to a `VCA` or directly to the `Master` node.
3.  Enter a sequence like `k s h s` into the "Sequence" text box.
4.  Press the main "Play" button in the transport controls to start the sequence.
5.  Adjust the BPM and Note Duration to change the feel of the beat.
