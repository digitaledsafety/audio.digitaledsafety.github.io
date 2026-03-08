# Audio

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Status: Beta](https://img.shields.io/badge/status-beta-orange.svg)

<div align="center">
  <video src="https://github.com/user-attachments/assets/46a131f9-5af2-4a31-b94f-40ed42ed10b9" controls width="400px">
    Your browser does not support the video tag.
  </video>
  <p><i>Turn on sound for the full experience!</i></p>
</div>


**Audio** is a powerful and intuitive web-based audio synthesis and processing environment. Built on the Web Audio API, it provides a node-based interface for creating complex audio routing, from simple synthesizers to intricate soundscapes.

## Features

*   **Unified Voltage System**: Inspired by modular hardware, all non-MIDI connections are interchangeable voltage signals, allowing for maximum creative flexibility. See the [Core Concepts](./docs/core-concepts.md) guide to learn more.
*   **Node-Based-Audio-Processing**: Connect a variety of audio nodes to create custom audio-processing chains.
*   **Real-Time-Sound-Synthesis**: Generate sound in real time with a variety of oscillator and noise generator nodes.
*   **MIDI-Support**: Control your synthesizers and sequencers with external MIDI devices.
*   **Save-and-Share-Workspaces**: Save your creations and share them with others.
*   **Workspace-Versioning**: Includes a data migration path to automatically update older workspace files to the latest format, ensuring backward compatibility.
*   **Cross-Platform**: Runs in any modern web browser.
*   **Progressive-Web-App**: Install Audio on your device for a native-app experience, and use it offline thanks to service worker caching.

## Getting Started

To get started with Audio, simply visit the [Audio website](https://audio.digitaleducationsafety.org) and start creating!

### Tutorial: Creating Your First Synthesizer

1.  **Add-a-Tone-Generator-Node**: This will be the sound source for your synthesizer. Click the "Add Node" button and select "Tone Generator".
2.  **Add-a-Master-Output-Node**: This will be the final output for your audio. Click the "Add Node" button and select "Master".
3.  **Connect-the-Nodes**: Click and drag from the output of the Tone Generator Node to the input of the Master Output Node.
4.  **Play-Your-Synthesizer**: You should now hear a sine wave playing. You can change the frequency and waveform of the Tone Generator Node to create different sounds.

### Tutorial: Real-Time Collaboration (Multiplayer)

Audio supports real-time multiplayer, allowing you to collaborate with others on the same workspace.

1.  **Open Settings**: Click the gear icon (⚙️) in the bottom navigation bar to open the Settings menu.
2.  **Create a Session**: In the "Multiplayer" section, click the **🤝 Create** button.
3.  **Share the Link**: Once the session is created, a unique link will appear in the "Share Link" box. Click the clipboard icon (📋) to copy the link and share it with your collaborators.
4.  **Collaborate**: Any changes made by you or your collaborators (adding nodes, moving them, changing parameters, or making connections) will be synchronized across all connected devices in real-time.

## Available Nodes

*   [ADSR Envelope](./docs/ADSREnvelopeNode.md)
*   [Arpeggiator](./docs/ArpeggiatorNode.md)
*   [Attenuverter](./docs/AttenuverterNode.md)
*   [Bitcrusher](./docs/BitcrusherNode.md)
*   [Chord Generator](./docs/ChordGeneratorNode.md)
*   [Compressor](./docs/CompressorNode.md)
*   [Delay](./docs/DelayNode.md)
*   [Distortion](./docs/DistortionNode.md)
*   [Drum Machine](./docs/drum-machine-node.md)
*   [Filter](./docs/FilterNode.md)
*   [Granular Synthesizer](./docs/GranularSynthesizerNode.md)
*   [LFO](./docs/LFONode.md)
*   [Manual Gate](./docs/ManualGateNode.md)
*   [Master](./docs/MasterGainOutputNode.md)
*   [Master Clock](./docs/MasterClockNode.md)
*   [Microphone Input](./docs/MicrophoneInputNode.md)
*   [Noise Generator](./docs/NoiseGeneratorNode.md)
*   [Quantizer](./docs/quantizer-node.md)
*   [Reverb](./docs/ReverbNode.md)
*   [Scale Arpeggiator](./docs/ScaleArpeggiatorNode.md)
*   [Sequencer](./docs/SequencerNode.md)
*   [Tone Generator](./docs/ToneGeneratorNode.md)
*   [VCA](./docs/VCANode.md)
*   [Vocoder](./docs/VocoderNode.md)
*   [Wave Player](./docs/WavePlayerNode.md)
