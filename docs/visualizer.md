# Audio Visualizer

The Audio Visualizer provides a real-time, audio-reactive visual experience that brings your soundscapes to life. It uses a sophisticated GLSL shader to render a central sphere that dynamically pulses, warps, and changes color in response to the frequencies of the audio stream.

## How It Works

The visualizer is powered by a WebGL canvas that renders a scene described by a GLSL fragment shader. Here’s a breakdown of the process:

1.  **Audio Analysis**: A Web Audio `AnalyserNode` continuously processes the main audio output, providing real-time frequency data.
2.  **Data to Shader**: This frequency data is passed to the fragment shader as a texture uniform.
3.  **Raymarching**: The shader uses a technique called raymarching to render a 3D sphere. This is more efficient than traditional polygon-based rendering for this type of generative art.
4.  **Geometric Distortion**: The bass and mid-range frequencies from the audio data are used to distort the sphere’s geometry, creating a fluid, pulsating effect.
5.  **Color Reactivity**: The various frequency bands (bass, mid, high) control the color of the sphere and the background, resulting in a visual experience that is uniquely tied to the sound being produced.

## Performance

The shader has been optimized to ensure a smooth frame rate on a variety of devices, including mobile. This is achieved by minimizing redundant calculations and reducing the complexity of the raymarching loop.
