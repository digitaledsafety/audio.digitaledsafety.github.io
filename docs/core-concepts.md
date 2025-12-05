# Core Concepts

## The Unified Voltage System: A Modular Philosophy

A foundational concept in this synthesizer, inspired by hardware modular systems like Eurorack, is the **Unified Voltage System**. Understanding this will unlock the full creative potential of the environment.

### What are those labels for?

You will notice that connection points (ports) on each node have specific labels, such as `Audio In`, `Gate In`, `Freq CV`, or `CV Out`. These labels describe the port's **primary or intended function**.

-   **Audio:** Typically expects or produces a signal that you can hear, which oscillates very quickly.
-   **Gate:** Typically expects or produces a signal that is either "on" (high voltage) or "off" (low voltage), used for triggering events like envelopes.
-   **CV (Control Voltage):** Typically expects or produces a signal that changes slowly over time, used for modulating parameters like filter frequency or amplitude.
-   **Clock:** A specialized, rhythmic gate signal used for synchronization.

### The Secret: All Jacks are the Same

Here is the most important part: **All non-MIDI ports are functionally identical.**

Despite their labels, they all send and receive the same fundamental thing: a "voltage" signal. This means you can connect **any output to any input**, regardless of the labels.

This opens up a world of experimental sound design, just like on a real modular synth. For example, you can:

-   Plug an **Audio Out** from an oscillator into the **Freq CV** input of a filter to create complex FM (Frequency Modulation) tones.
-   Use the **Gate Out** of a clock as an audible click by plugging it into an **Audio In** on a VCA or the Master Output.
-   Control a parameter that expects a slow CV signal with a fast-running **Audio** signal to create chaotic, noisy textures.

Think of the labels as helpful guides, not strict rules. Don't be afraid to experiment with unconventional connections—that's where the magic of modular synthesis truly lies.
