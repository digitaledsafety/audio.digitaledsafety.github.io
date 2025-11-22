// A compact biquad filter implementation for the AudioWorklet
class BiquadFilter {
    constructor() {
        this.a1 = this.a2 = this.b0 = this.b1 = this.b2 = 0;
        this.x1 = this.x2 = this.y1 = this.y2 = 0;
    }

    setBandpass(freq, q, sampleRate) {
        const w0 = 2 * Math.PI * freq / sampleRate;
        const cosW0 = Math.cos(w0);
        const sinW0 = Math.sin(w0);
        const alpha = sinW0 / (2 * q);

        this.b0 = alpha;
        this.b1 = 0;
        this.b2 = -alpha;
        const a0 = 1 + alpha;
        this.a1 = -2 * cosW0 / a0;
        this.a2 = (1 - alpha) / a0;
    }

    process(input) {
        const result = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1;
        this.x1 = input;
        this.y2 = this.y1;
        this.y1 = result;
        return result;
    }
}

// Simple envelope follower
class EnvelopeFollower {
    constructor(attack, release, sampleRate) {
        this.attack = Math.exp(-1 / (sampleRate * attack));
        this.release = Math.exp(-1 / (sampleRate * release));
        this.envelope = 0;
    }

    process(input) {
        const absInput = Math.abs(input);
        if (absInput > this.envelope) {
            this.envelope = this.attack * (this.envelope - absInput) + absInput;
        } else {
            this.envelope = this.release * (this.envelope - absInput) + absInput;
        }
        return this.envelope;
    }
}

class VocoderProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'formantShift', defaultValue: 0, minValue: -1200, maxValue: 1200, automationRate: 'k-rate' },
            { name: 'unvoicedLevel', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
            { name: 'numBands', defaultValue: 16, minValue: 8, maxValue: 40, automationRate: 'k-rate' }
        ];
    }

    constructor(options) {
        super(options);
        this.sampleRate = sampleRate;
        this.numBands = 0;
        this.lastFormantShift = -9999; // Initialize to a value that guarantees first-run update
        this.modulatorFilters = [];
        this.carrierFilters = [];
        this.envelopeFollowers = [];
        this.baseFrequencies = [];
    }

    rebuildFilters(numBands, formantShift) {
        // Store current values to prevent unnecessary recalculations
        this.numBands = numBands;
        this.lastFormantShift = formantShift;

        this.modulatorFilters = [];
        this.carrierFilters = [];
        this.envelopeFollowers = [];
        this.baseFrequencies = [];

        const minFreq = 80;
        const maxFreq = 12000;
        const formantRatio = Math.pow(2, formantShift / 1200);

        for (let i = 0; i < this.numBands; i++) {
            const ratio = i / (this.numBands - 1);
            const freq = minFreq * Math.pow(maxFreq / minFreq, ratio);
            this.baseFrequencies.push(freq);

            const shiftedFreq = freq * formantRatio;

            const modFilter = new BiquadFilter();
            modFilter.setBandpass(shiftedFreq, 5, this.sampleRate);
            this.modulatorFilters.push(modFilter);

            const carFilter = new BiquadFilter();
            carFilter.setBandpass(shiftedFreq, 5, this.sampleRate);
            this.carrierFilters.push(carFilter);

            const envFollower = new EnvelopeFollower(0.005, 0.05, this.sampleRate);
            this.envelopeFollowers.push(envFollower);
        }
    }


    process(inputs, outputs, parameters) {
        const carrierInput = inputs[0];
        const modulatorInput = inputs[1];
        const output = outputs[0];

        const numBands = parameters.numBands[0];
        const formantShift = parameters.formantShift[0];
        const unvoicedLevel = parameters.unvoicedLevel[0];
        const OUTPUT_GAIN = 2.0;

        // --- Performance Optimization ---
        // Only rebuild the filters if the number of bands or formant shift has changed.
        // Since these are k-rate, they only change once per processing block.
        if (this.numBands !== numBands || this.lastFormantShift !== formantShift) {
            this.rebuildFilters(numBands, formantShift);
        }

        if (!carrierInput[0] || !modulatorInput[0] || this.numBands === 0) {
            return true; // Not enough inputs or not initialized, do nothing
        }

        const carrier = carrierInput[0];
        const modulator = modulatorInput[0];
        const out = output[0];

        for (let i = 0; i < out.length; i++) {
            let vocodedSample = 0;

            for (let j = 0; j < this.numBands; j++) {
                const modSample = this.modulatorFilters[j].process(modulator[i]);
                const envelope = this.envelopeFollowers[j].process(modSample);
                const carSample = this.carrierFilters[j].process(carrier[i]);
                vocodedSample += carSample * envelope;
            }

            // Generate and mix in unvoiced (hiss) sound
            const whiteNoise = Math.random() * 2 - 1;
            const unvoicedSound = whiteNoise * unvoicedLevel;

            // Mix vocoded signal with unvoiced sound and apply gain
            out[i] = (vocodedSample + unvoicedSound) * OUTPUT_GAIN;
        }

        // Copy to other channels if they exist
        for (let channel = 1; channel < output.length; channel++) {
            output[channel].set(out);
        }

        return true;
    }
}

registerProcessor('vocoder-processor', VocoderProcessor);
