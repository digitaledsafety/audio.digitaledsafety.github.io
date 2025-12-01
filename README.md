# AudioGrid

**AudioGrid** is a powerful and intuitive web-based audio synthesis and processing environment. Built on the Web Audio API, it provides a node-based interface for creating complex audio routing, from simple synthesizers to intricate soundscapes.

## Features

*   **Node-Based-Audio-Processing**: Connect a variety of audio nodes to create custom audio-processing chains.
*   **Real-Time-Sound-Synthesis**: Generate sound in real time with a variety of oscillator and noise generator nodes.
*   **MIDI-Support**: Control your synthesizers and sequencers with external MIDI devices.
*   **Save-and-Share-Workspaces**: Save your creations and share them with others.
*   **Dynamic Audio Visualizer**: Experience a real-time, audio-reactive visualizer that brings your soundscapes to life with fluid, geometric animations.
*   **Cross-Platform**: Runs in any modern web browser.
*   **Progressive-Web-App**: Install AudioGrid on your device for a native-app experience, and use it offline thanks to service worker caching.

## Getting Started

To get started with AudioGrid, simply visit the [AudioGrid website](https://audiogrid.io) and start creating!

### Tutorial: Creating Your First Synthesizer

1.  **Add-a-Tone-Generator-Node**: This will be the sound source for your synthesizer. Click the "Add Node" button and select "Tone Generator".
2.  **Add-a-Master-Output-Node**: This will be the final output for your audio. Click the "Add Node" button and select "Master".
3.  **Connect-the-Nodes**: Click and drag from the output of the Tone Generator Node to the input of the Master Output Node.
4.  **Play-Your-Synthesizer**: You should now hear a sine wave playing. You can change the frequency and waveform of the Tone Generator Node to create different sounds.

## Available Nodes

*   [ADSR Envelope](./docs/ADSREnvelopeNode.md)
*   [Arpeggiator](./docs/ArpeggiatorNode.md)
*   [Attenuverter](./docs/AttenuverterNode.md)
*   [Bitcrusher](./docs/BitcrusherNode.md)
*   [Chord Generator](./docs/ChordGeneratorNode.md)
*   [Compressor](./docs/CompressorNode.md)
*   [Delay](./docs/DelayNode.md)
*   [Distortion](./docs/DistortionNode.md)
*   [Filter](./docs/FilterNode.md)
*   [Granular Synthesizer](./docs/GranularSynthesizerNode.md)
*   [LFO](./docs/LFONode.md)
*   [Manual Gate](./docs/ManualGateNode.md)
*   [Master](./docs/MasterGainOutputNode.md)
*   [Master Clock](./docs/MasterClockNode.md)
*   [Microphone Input](./docs/MicrophoneInputNode.md)
*   [Mixer](./docs/MixerNode.md)
*   [Noise Generator](./docs/NoiseGeneratorNode.md)
*   [Reverb](./docs/ReverbNode.md)
*   [Scale Arpeggiator](./docs/ScaleArpeggiatorNode.md)
*   [Sequencer](./docs/SequencerNode.md)
*   [Tone Generator](./docs/ToneGeneratorNode.md)
*   [VCA](./docs/VCANode.md)
*   [Vocoder](./docs/VocoderNode.md)
*   [Wave Player](./docs/WavePlayerNode.md)
