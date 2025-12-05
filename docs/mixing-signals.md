# Mixing Signals

In a modular synthesis environment, you often want to combine multiple sound sources. While a traditional mixer node might seem intuitive, this system uses a more flexible, modular approach: **chaining VCAs (Voltage-Controlled Amplifiers)**.

This method gives you precise control over each signal and stays true to the modular philosophy of building complex functions from simple, powerful building blocks.

## How to Mix Two Signals

Let's say you have two different sound sources, like a `ToneGeneratorNode` and a `NoiseGeneratorNode`, and you want to mix them together before sending them to a `FilterNode`.

1.  **First VCA:** Connect the `Audio` output of your `ToneGeneratorNode` to the `Audio In` of a `VCANode`.
2.  **Second VCA:** Connect the `Audio` output of your `NoiseGeneratorNode` to the `Audio In` of a *second* `VCANode`.
3.  **Chain the VCAs:** This is the key step. Connect the `Audio Out` of the first VCA to the **`Audio In`** of the second VCA.
4.  **Connect to Destination:** Connect the `Audio Out` of the *second* VCA to your desired destination, like the `Audio In` of the `FilterNode`.

Now, the output of the second VCA contains the mixed signal of both the tone generator and the noise generator.

## Why this method?

-   **Individual Volume Control:** Each `VCANode` has its own `Gain` control, allowing you to set the volume of each sound source in the mix independently.
-   **Modular Control:** You can use LFOs, envelopes, or other CV sources to modulate the `Gain CV` input of each VCA, creating dynamic, evolving mixes that wouldn't be possible with a simple mixer.
-   **Unlimited Channels:** You can chain as many VCAs together as you need. To add a third signal, simply add a third VCA and connect the output of the second one into its input.

This approach is a core technique in modular synthesis and provides a level of flexibility that a fixed mixer cannot match.
