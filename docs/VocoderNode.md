# Vocoder Node

The Vocoder Node imposes the spectral characteristics of a modulator signal onto a carrier signal, famously used to create "robot voice" effects.

## Inputs

*   **Carrier In**: The signal that provides the pitch and tone (e.g., a synthesizer waveform). If nothing is connected, an internal oscillator is used.
*   **Modulator In**: The signal that provides the spectral shape (e.g., a human voice from a microphone).
*   **Freq CV**: Modulates the frequency of the internal carrier oscillator.
*   **Bands CV**: Modulates the number of filter bands used for analysis/synthesis.
*   **Formant CV**: Modulates the formant shift, which raises or lowers the resonant frequencies of the filter bank.
*   **Unvoiced CV**: Modulates the level of unvoiced sound (like static or hiss) mixed into the output.

## Outputs

*   **Audio Out**: The vocoded audio signal.

## Controls

*   **Carrier Freq**: Sets the frequency of the internal carrier oscillator when no external carrier is connected.
*   **Carrier Wave**: Sets the waveform of the internal carrier oscillator.
*   **Bands**: The number of frequency bands used by the vocoder. More bands result in a more detailed and intelligible sound.
*   **Formant Shift (cents)**: Shifts the filter bank's frequencies up or down, altering the timbral character of the output.
*   **Unvoiced Level**: Controls the amount of high-frequency noise mixed with the signal, which helps to preserve consonants and sibilance (like "s" sounds).
