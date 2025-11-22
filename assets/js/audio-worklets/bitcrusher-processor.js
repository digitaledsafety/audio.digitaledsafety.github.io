// bitcrusher-processor.js
// This file will be loaded by the AudioContext's audioWorklet.addModule()

class BitcrusherProcessor extends AudioWorkletProcessor {
// Define custom parameters that can be controlled from the main thread
static get parameterDescriptors() {
    return [
    {
        name: 'bits',
        defaultValue: 8,
        minValue: 1,
        maxValue: 16,
        automationRate: 'a-rate' // 'a-rate' for audio-rate changes (smoother)
    },
    {
        name: 'sampleRateReduction', // Factor by which to reduce sample rate (e.g., 2 means half sample rate)
        defaultValue: 1,
        minValue: 1,
        maxValue: 100, // Or whatever max reduction you want
        automationRate: 'a-rate'
    }
    ];
}

constructor() {
    super();
    this.lastSample = 0; // For sample rate reduction: holds the last processed sample
    this.phase = 0;      // For sample rate reduction: accumulator for timing
}

process(inputs, outputs, parameters) {
    const input = inputs[0]; // Get the first input (assuming single input)
    const output = outputs[0]; // Get the first output (assuming single output)

    // Get the parameter values (they are arrays, even if constant, check first element)
    const bits = parameters.bits[0];
    const sampleRateReduction = parameters.sampleRateReduction[0];

    // Process each channel
    for (let channel = 0; channel < input.length; ++channel) {
    const inputChannel = input[channel];
    const outputChannel = output[channel];

    for (let i = 0; i < inputChannel.length; ++i) {
        let currentSample = inputChannel[i];

        // --- Bit Depth Reduction ---
        // Calculate the step size for quantization
        const step = Math.pow(0.5, bits); // e.g., 8 bits -> 2^8 = 256 levels -> step = 1/256
        // Quantize the sample
        currentSample = Math.floor(currentSample / step) * step;

        // --- Sample Rate Reduction (simple hold method) ---
        // Increment phase by the reduction factor. When it hits 1, process a new sample.
        this.phase += 1 / sampleRateReduction; // If reduction is 2, phase increases by 0.5 each sample
        if (this.phase >= 1) {
        this.phase--; // Reset phase
        this.lastSample = currentSample; // Store the new "processed" sample
        }
        // Output the last processed sample (either the newly processed one or the held one)
        outputChannel[i] = this.lastSample;
    }
    }
    return true; // Indicate that the processor is still active
}
}

// Register the processor with a unique name
registerProcessor('bitcrusher-processor', BitcrusherProcessor);