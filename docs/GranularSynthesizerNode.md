# Granular Synthesizer Node

The Granular Synthesizer Node processes an incoming audio signal by breaking it down into tiny fragments (grains) and then reassembling them. This can create a wide range of effects, from subtle textures and time-stretching to complex, evolving soundscapes.

## Inputs

*   **Audio In**: The live audio signal to be granulated.
*   **Grain Size CV**: Modulates the duration of each individual grain.
*   **Grain Density CV**: Modulates the rate at which new grains are generated.
*   **Pitch Shift CV**: Modulates the pitch transposition of each grain.
*   **Jitter CV**: Modulates the amount of randomization in the playback position of each grain.

## Outputs

*   **Audio Out**: The processed granular audio signal.

## Controls

*   **Grain Size (s)**: The duration of each audio grain in seconds.
*   **Grain Density (Hz)**: The frequency at which new grains are created. Higher values result in more overlapping grains and a denser sound.
*   **Pitch Shift (cents)**: The amount to shift the pitch of each grain up or down. 100 cents equals one semitone.
*   **Position Jitter**: The amount of randomness applied to the start position of each grain within the audio buffer. Higher values create a more chaotic and smeared sound.
