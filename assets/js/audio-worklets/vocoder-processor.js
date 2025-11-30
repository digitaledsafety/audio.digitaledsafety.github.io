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

    setHighpass(freq, q, sampleRate) {
        const w0 = 2 * Math.PI * freq / sampleRate;
        const cosW0 = Math.cos(w0);
        const sinW0 = Math.sin(w0);
        const alpha = sinW0 / (2 * q);

        this.b0 = (1 + cosW0) / 2 / (1 + alpha);
        this.b1 = -(1 + cosW0) / (1 + alpha);
        this.b2 = (1 + cosW0) / 2 / (1 + alpha);
        this.a1 = -2 * cosW0 / (1 + alpha);
        this.a2 = (1 - alpha) / (1 + alpha);
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
            { name: 'unvoicedLevel', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
            { name: 'numBands', defaultValue: 16, minValue: 8, maxValue: 40, automationRate: 'k-rate' }
        ];
    }

    constructor(options) {
        super(options);
        this.sampleRate = sampleRate;
        this.numBands = 0;
        this.lastFormantShift = -9999; // Guarantees first-run update
        this.modulatorFilters = [];
        this.carrierFilters = [];
        this.envelopeFollowers = [];
        this.baseFrequencies = [];

        // For unvoiced sound processing
        this.noiseFilter = new BiquadFilter();
        this.noiseFilter.setHighpass(5000, 1, this.sampleRate);
        this.modulatorEnvelopeFollower = new EnvelopeFollower(0.005, 0.05, this.sampleRate);
    }

    rebuildFilters(numBands, formantShift) {
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
            modFilter.setBandpass(shiftedFreq, 20, this.sampleRate); // Increased Q
            this.modulatorFilters.push(modFilter);

            const carFilter = new BiquadFilter();
            carFilter.setBandpass(shiftedFreq, 20, this.sampleRate); // Increased Q
            this.carrierFilters.push(carFilter);

            // Faster attack/release
            const envFollower = new EnvelopeFollower(0.002, 0.01, this.sampleRate);
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
        const OUTPUT_GAIN = 1.5;

        if (this.numBands !== numBands || this.lastFormantShift !== formantShift) {
            this.rebuildFilters(numBands, formantShift);
        }

        if (!carrierInput[0] || !modulatorInput[0] || this.numBands === 0) {
            for (let i = 0; i < output[0].length; i++) {
                output[0][i] = 0;
            }
            return true;
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

            // --- Unvoiced Sound Processing ---
            // 1. Generate white noise
            const whiteNoise = Math.random() * 2 - 1;
            // 2. Filter it to get a "hiss"
            const filteredNoise = this.noiseFilter.process(whiteNoise);
            // 3. Get the overall volume of the modulator (the voice)
            const modulatorEnvelope = this.modulatorEnvelopeFollower.process(modulator[i]);
            // 4. Shape the hiss with the voice's volume and the unvoicedLevel knob
            const unvoicedSound = filteredNoise * modulatorEnvelope * unvoicedLevel * 5;

            out[i] = (vocodedSample + unvoicedSound) * OUTPUT_GAIN;
        }

        for (let channel = 1; channel < output.length; channel++) {
            output[channel].set(out);
        }

        return true;
    }
}

registerProcessor('vocoder-processor', VocoderProcessor);
