# Attenuverter Node

The Attenuverter Node is a utility for scaling and inverting Control Voltage (CV) signals. It can make a modulation signal stronger or weaker (attenuate) and flip its polarity (invert).

## Inputs

*   **In**: The CV signal to be processed.

## Outputs

*   **Out**: The processed CV signal.

## Controls

*   **Level**: A bipolar control that sets the amount of attenuation or inversion.
    *   A value of `1` passes the signal through unchanged.
    *   Values between `0` and `1` reduce the signal's amplitude.
    *   A value of `0` completely silences the signal.
    *   Negative values invert the signal's polarity. For example, a value of `-1` passes the signal through at its original amplitude but inverted.
