# Quantizer Node

The Quantizer node snaps an incoming continuous voltage (CV) signal to the nearest note in a specified musical scale. It's an essential tool for generating melodic sequences from non-quantized CV sources like LFOs or random voltage generators.

## Inputs

-   **CV In**: Accepts a CV signal for quantization. The standard is 1V/Octave.

## Outputs

-   **CV Out**: Outputs the quantized CV signal, which will correspond to the notes of the selected scale.

## Controls

-   **Root Note**: Sets the root note of the scale to which the input signal will be quantized.
-   **Scale**: Selects the musical scale to use for quantization. A wide variety of common scales are available.
