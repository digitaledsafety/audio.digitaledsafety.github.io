# Stereo Panner Node

The Stereo Panner Node is used to position an audio signal in the stereo field (left/right).

## Inputs

*   **Audio In**: The audio signal to be panned.
*   **Pan CV**: A Control Voltage input to modulate the stereo position.

## Outputs

*   **Audio Out**: The panned stereo audio signal.

## Controls

*   **Pan**: Sets the base stereo position.
    *   -1.0: Full Left
    *   0.0: Center
    *   1.0: Full Right
    This value is added to any modulation from the Pan CV input.
