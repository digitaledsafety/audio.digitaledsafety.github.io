/**
 * Ported Audio Nodes for the custom AudioEditor.
 */

const voltageSocket = new AudioSocket('voltage');
const midiSocket = new AudioSocket('midi');

class ToneGeneratorNode extends AudioNode {
    constructor() {
        super('Tone Generator');
        this.addInput('freq', new AudioPort(voltageSocket, 'Freq CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));

        this.data.frequency = 440;
        this.addControl('frequency', new SliderControl('freqSlider', 'Frequency (Hz)', 20, 20000, 1, this.data.frequency, (val) => {
            this.data.frequency = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.frequency) {
                audioNode.frequency.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }, true));

        this.data.waveform = 'sine';
        this.addControl('waveform', new SelectControl('waveformSelect', 'Waveform', ['sine', 'square', 'sawtooth', 'triangle'], this.data.waveform, (val) => {
            this.data.waveform = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.type) {
                audioNode.type = val;
            }
        }));
    }

    build() {
        const audioNode = window.audioContext.createOscillator();
        audioNode.frequency.value = this.data.frequency !== undefined ? this.data.frequency : 440;
        audioNode.type = this.data.waveform || 'sine';
        audioNode.started = false;
        return audioNode;
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class NoiseGeneratorNode extends AudioNode {
    constructor() {
        super('Noise Generator');
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));

        this.data.gainValue = 1;
        this.addControl('gain', new SliderControl('gainSlider', 'Gain', 0, 5, 0.01, this.data.gainValue, (val) => {
            this.data.gainValue = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof NoiseGenerator) {
                audioNode.updateParameter('gainValue', val);
            }
        }));
    }

    build() {
        return new NoiseGenerator(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class WavePlayerNode extends AudioNode {
    constructor() {
        super('Wave Player');
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));

        this.data.audioUrl = 'https://webaudio.github.io/web-audio-api/samples/audio/impulse-responses/small-room.wav';
        this.addControl('audioUrl', new TextControl('audioUrl', 'Audio URL', this.data.audioUrl, (val) => {
            this.data.audioUrl = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof WavePlayer) {
                audioNode.updateParameter('audioUrl', val);
            }
        }));

        this.addControl('play', new ButtonControl('playButton', 'Play', async () => {
            if (!window.audioContext || window.audioContext.state !== 'running') {
                if (window.startAudio) await window.startAudio();
            }
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof WavePlayer) {
                audioNode.play();
            }
        }));
    }

    build() {
        return new WavePlayer(window.audioContext, this.id, this.data);
    }
}

class FilterNode extends AudioNode {
    constructor() {
        super('Filter');

        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addInput('freq', new AudioPort(voltageSocket, 'Freq CV'));
        this.addInput('q_cv', new AudioPort(voltageSocket, 'Q CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.frequency = 5000;
        this.addControl('frequency', new SliderControl('filterFreqSlider', 'Frequency (Hz)', 20, 20000, 10, this.data.frequency, (val) => {
            this.data.frequency = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.frequency) {
                audioNode.frequency.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }, true));

        this.data.q = 1;
        this.addControl('q', new SliderControl('qSlider', 'Q', 0.1, 20, 0.1, this.data.q, (val) => {
            this.data.q = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.Q) {
                audioNode.Q.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));

        this.data.filterType = 'lowpass';
        this.addControl('filterType', new SelectControl('filterTypeSelect', 'Type', ['lowpass', 'highpass', 'bandpass', 'notch'], this.data.filterType, (val) => {
            this.data.filterType = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.type) {
                audioNode.type = val;
            }
        }));
    }

    build() {
        const audioNode = window.audioContext.createBiquadFilter();
        audioNode.type = this.data.filterType || 'lowpass';
        audioNode.frequency.value = this.data.frequency !== undefined ? this.data.frequency : 2000;
        audioNode.Q.value = this.data.q !== undefined ? this.data.q : 1;
        return audioNode;
    }
}

class DelayNode extends AudioNode {
    constructor() {
        super('Delay');

        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addInput('delay_cv', new AudioPort(voltageSocket, 'Delay CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.delayTime = 0.5;
        this.addControl('delayTime', new SliderControl('delayTimeSlider', 'Delay Time (s)', 0, 5, 0.01, this.data.delayTime, (val) => {
            this.data.delayTime = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.delayTime) {
                audioNode.delayTime.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));
    }

    build() {
        const audioNode = window.audioContext.createDelay(5.0);
        audioNode.delayTime.value = this.data.delayTime !== undefined ? this.data.delayTime : 0.5;
        return audioNode;
    }
}

class ReverbNode extends AudioNode {
    constructor() {
        super('Reverb');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.duration = 2;
        this.addControl('duration', new SliderControl('reverbDuration', 'Duration (s)', 0.1, 10, 0.1, this.data.duration, (val) => {
            this.data.duration = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.convolver) {
                audioNode.convolver.buffer = generateImpulseResponse(window.audioContext, this.data.duration, this.data.decay);
            }
        }));

        this.data.decay = 2;
        this.addControl('decay', new SliderControl('reverbDecay', 'Decay', 0.1, 10, 0.1, this.data.decay, (val) => {
            this.data.decay = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.convolver) {
                audioNode.convolver.buffer = generateImpulseResponse(window.audioContext, this.data.duration, this.data.decay);
            }
        }));

        this.data.mix = 0.5;
        this.addControl('mix', new SliderControl('reverbMix', 'Mix', 0, 1, 0.01, this.data.mix, (val) => {
            this.data.mix = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.dryGain && audioNode.wetGain) {
                audioNode.dryGain.gain.setTargetAtTime(1 - val, window.audioContext.currentTime, 0.01);
                audioNode.wetGain.gain.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));

    }

    build() {
        const convolver = window.audioContext.createConvolver();
        const dryGain = window.audioContext.createGain();
        const wetGain = window.audioContext.createGain();
        const mainInput = window.audioContext.createGain();
        const mainOutput = window.audioContext.createGain();

        this.data.duration = this.data.duration || 2;
        this.data.decay = this.data.decay || 2;
        convolver.buffer = generateImpulseResponse(window.audioContext, this.data.duration, this.data.decay);

        this.data.mix = this.data.mix || 0.5;
        dryGain.gain.value = 1 - this.data.mix;
        wetGain.gain.value = this.data.mix;

        mainInput.connect(dryGain);
        mainInput.connect(convolver);
        convolver.connect(wetGain);
        dryGain.connect(mainOutput);
        wetGain.connect(mainOutput);

        mainInput.convolver = convolver;
        mainInput.dryGain = dryGain;
        mainInput.wetGain = wetGain;
        mainInput.mainOutput = mainOutput;

        mainInput.connect = function(destination) {
            this.mainOutput.connect(destination);
        };

        mainInput.disconnect = function(destination) {
            this.mainOutput.disconnect(destination);
        };

        return mainInput;
    }
}

class DistortionNode extends AudioNode {
    constructor() {
        super('Distortion');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.drive = 50;
        this.addControl('drive', new SliderControl('distortionDrive', 'Drive', 0, 100, 1, this.data.drive, (val) => {
            this.data.drive = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.waveShaper) {
                setDistortionCurve(audioNode.waveShaper, this.data.amount, this.data.drive);
            }
        }));

        this.data.tone = 5000;
        this.addControl('tone', new SliderControl('distortionTone', 'Tone', 200, 10000, 1, this.data.tone, (val) => {
            this.data.tone = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.toneFilter) {
                audioNode.toneFilter.frequency.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));

        this.data.amount = 0;
        this.addControl('amount', new SliderControl('distortionAmount', 'Amount (%)', 0, 100, 1, this.data.amount, (val) => {
            this.data.amount = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.waveShaper) {
                setDistortionCurve(audioNode.waveShaper, this.data.amount, this.data.drive);
            }
        }));
    }

    build() {
        const waveShaper = window.audioContext.createWaveShaper();
        setDistortionCurve(waveShaper, this.data.amount !== undefined ? this.data.amount : 0, this.data.drive !== undefined ? this.data.drive : 50);

        const toneFilter = window.audioContext.createBiquadFilter();
        toneFilter.type = 'lowpass';
        toneFilter.frequency.value = this.data.tone !== undefined ? this.data.tone : 5000;

        waveShaper.connect(toneFilter);

        const audioNode = {
            mainInput: waveShaper,
            mainOutput: toneFilter,
            waveShaper: waveShaper,
            toneFilter: toneFilter,
            connect: function(destination) {
                this.mainOutput.connect(destination);
            },
            disconnect: function(destination) {
                this.mainOutput.disconnect(destination);
            }
        };
        return audioNode;
    }
}

class CompressorNode extends AudioNode {
    constructor() {
        super('Compressor');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.threshold = -24;
        this.addControl('threshold', new SliderControl('compThreshold', 'Threshold (dB)', -60, 0, 1, this.data.threshold, (val) => {
            this.data.threshold = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.threshold) audioNode.threshold.value = val;
        }));

        this.data.ratio = 12;
        this.addControl('ratio', new SliderControl('compRatio', 'Ratio', 1, 20, 0.1, this.data.ratio, (val) => {
            this.data.ratio = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.ratio) audioNode.ratio.value = val;
        }));

        this.data.attack = 0.003;
        this.addControl('attack', new SliderControl('compAttack', 'Attack (s)', 0, 1, 0.001, this.data.attack, (val) => {
            this.data.attack = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.attack) audioNode.attack.value = val;
        }));

        this.data.release = 0.25;
        this.addControl('release', new SliderControl('compRelease', 'Release (s)', 0, 1, 0.001, this.data.release, (val) => {
            this.data.release = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.release) audioNode.release.value = val;
        }));
    }

    build() {
        const audioNode = window.audioContext.createDynamicsCompressor();
        audioNode.threshold.value = this.data.threshold !== undefined ? this.data.threshold : -24;
        audioNode.ratio.value = this.data.ratio !== undefined ? this.data.ratio : 12;
        audioNode.attack.value = this.data.attack !== undefined ? this.data.attack : 0.003;
        audioNode.release.value = this.data.release !== undefined ? this.data.release : 0.25;
        return audioNode;
    }
}

class VCANode extends AudioNode {
    constructor() {
        super('VCA');

        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addInput('gain_cv', new AudioPort(voltageSocket, 'Gain CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.gain = 1;
        this.addControl('gain', new SliderControl('gainSlider', 'Gain', -1, 10, 0.01, this.data.gain, (val) => {
            this.data.gain = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.gain) {
                audioNode.gain.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));
    }

    build() {
        const audioNode = window.audioContext.createGain();
        audioNode.gain.value = this.data.gain;
        return audioNode;
    }
}

class MixerNode extends AudioNode {
    constructor() {
        super('Mixer');
        this.addInput('in1', new AudioPort(voltageSocket, 'In 1'));
        this.addInput('in2', new AudioPort(voltageSocket, 'In 2'));
        this.addInput('in3', new AudioPort(voltageSocket, 'In 3'));
        this.addInput('in4', new AudioPort(voltageSocket, 'In 4'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.gain1 = 0.8;
        this.addControl('gain1', new SliderControl('gain1', 'Gain 1', 0, 1, 0.01, this.data.gain1, (val) => {
            this.data.gain1 = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('gain1', val);
        }));

        this.data.gain2 = 0.8;
        this.addControl('gain2', new SliderControl('gain2', 'Gain 2', 0, 1, 0.01, this.data.gain2, (val) => {
            this.data.gain2 = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('gain2', val);
        }));

        this.data.gain3 = 0.8;
        this.addControl('gain3', new SliderControl('gain3', 'Gain 3', 0, 1, 0.01, this.data.gain3, (val) => {
            this.data.gain3 = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('gain3', val);
        }));

        this.data.gain4 = 0.8;
        this.addControl('gain4', new SliderControl('gain4', 'Gain 4', 0, 1, 0.01, this.data.gain4, (val) => {
            this.data.gain4 = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('gain4', val);
        }));
    }

    build() {
        return new Mixer(window.audioContext, this.id, this.data);
    }
}

class MasterGainOutputNode extends AudioNode {
    constructor() {
        super('Master');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addInput('gain_cv', new AudioPort(voltageSocket, 'Gain CV'));

        this.data.gain = 0.5;
        this.addControl('gain', new SliderControl('gainSlider', 'Gain', 0, 1, 0.01, this.data.gain, (val) => {
            this.data.gain = val;
            if (window.masterGain) {
                window.masterGain.gain.value = val;
            }
        }));
    }

    build() {
        if (window.masterGain) {
            window.masterGain.gain.value = this.data.gain;
        }
        return window.masterGain;
    }
}

class LFONode extends AudioNode {
    constructor() {
        super('LFO');
        this.addOutput('cv', new AudioPort(voltageSocket, 'CV Out'));

        this.data.frequency = 5;
        this.addControl('frequency', new SliderControl('lfoFreq', 'Frequency (Hz)', 0.1, 20, 0.1, this.data.frequency, (val) => {
            this.data.frequency = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof LFOGenerator) audioNode.updateParameter('frequency', val);
        }));

        this.data.waveform = 'sine';
        this.addControl('waveform', new SelectControl('lfoWaveform', 'Waveform', ['sine', 'square', 'sawtooth', 'triangle'], this.data.waveform, (val) => {
            this.data.waveform = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof LFOGenerator) audioNode.updateParameter('waveform', val);
        }));

        this.data.amount = 500;
        this.addControl('amount', new SliderControl('lfoAmount', 'Amount', 0, 2000, 1, this.data.amount, (val) => {
            this.data.amount = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof LFOGenerator) audioNode.updateParameter('amount', val);
        }));
    }

    build() {
        return new LFOGenerator(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class BitcrusherNode extends AudioNode {
    constructor() {
        super('Bitcrusher');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.bits = 8;
        this.addControl('bits', new SliderControl('bits', 'Bit Depth', 1, 16, 1, this.data.bits, (val) => {
            this.data.bits = val;
            const liveAudioNode = audioNodes.get(this.id);
            if (liveAudioNode && liveAudioNode.parameters) {
                liveAudioNode.parameters.get('bits').setValueAtTime(val, window.audioContext.currentTime);
            }
        }));

        this.data.sampleRateReduction = 1;
        this.addControl('sampleRateReduction', new SliderControl('sampleRateReduction', 'Sample Rate Reduction', 1, 20, 1, this.data.sampleRateReduction, (val) => {
            this.data.sampleRateReduction = val;
            const liveAudioNode = audioNodes.get(this.id);
            if (liveAudioNode && liveAudioNode.parameters) {
                liveAudioNode.parameters.get('sampleRateReduction').setValueAtTime(val, window.audioContext.currentTime);
            }
        }));
    }

    build() {
        const audioNode = new AudioWorkletNode(window.audioContext, 'bitcrusher-processor');
        audioNode.parameters.get('bits').setValueAtTime(
            this.data.bits !== undefined ? this.data.bits : 8,
            window.audioContext.currentTime
        );
        audioNode.parameters.get('sampleRateReduction').setValueAtTime(
            this.data.sampleRateReduction !== undefined ? this.data.sampleRateReduction : 1,
            window.audioContext.currentTime
        );
        return audioNode;
    }
}

class ADSREnvelopeNode extends AudioNode {
    constructor() {
        super('ADSR Envelope');
        this.addInput('gate', new AudioPort(voltageSocket, 'Gate In'));
        this.addOutput('cv', new AudioPort(voltageSocket, 'CV Out'));

        this.data.mode = 'EG';
        this.addControl('mode', new SelectControl('adsrMode', 'Mode', ['EG', 'GATE', 'LFO'], this.data.mode, (val) => {
            this.data.mode = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ADSREnvelope) audioNode.updateParameter('mode', val);
        }));

        this.data.attack = 0.01;
        this.addControl('attack', new SliderControl('adsrAttack', 'Attack (s)', 0.01, 2, 0.01, this.data.attack, (val) => {
            this.data.attack = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ADSREnvelope) audioNode.updateParameter('attack', val);
        }));

        this.data.decay = 0.1;
        this.addControl('decay', new SliderControl('adsrDecay', 'Decay (s)', 0.01, 2, 0.01, this.data.decay, (val) => {
            this.data.decay = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ADSREnvelope) audioNode.updateParameter('decay', val);
        }));

        this.data.sustain = 0.5;
        this.addControl('sustain', new SliderControl('adsrSustain', 'Sustain', 0, 1, 0.01, this.data.sustain, (val) => {
            this.data.sustain = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ADSREnvelope) audioNode.updateParameter('sustain', val);
        }));

        this.data.release = 0.1;
        this.addControl('release', new SliderControl('adsrRelease', 'Release (s)', 0.01, 5, 0.01, this.data.release, (val) => {
            this.data.release = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ADSREnvelope) audioNode.updateParameter('release', val);
        }));
    }

    build() {
        return new ADSREnvelope(window.audioContext, this.id, this.data);
    }
}

class SequencerNode extends AudioNode {
    constructor() {
        super('Sequencer');
        this.addInput('clock', new AudioPort(voltageSocket, 'Clock In'));
        this.addInput('transpose_cv', new AudioPort(voltageSocket, 'Transpose CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));
        this.addOutput('midi', new AudioPort(midiSocket, 'MIDI Out'));

        this.data.bpm = 120;
        this.addControl('bpm', new SliderControl('seqBpm', 'BPM', 60, 240, 1, this.data.bpm, (val) => {
            this.data.bpm = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('bpm', val);
        }));

        this.data.noteDuration = '1/16';
        this.addControl('noteDuration', new SelectControl('seqNoteDuration', 'Note Duration', ['1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'], this.data.noteDuration, (val) => {
            this.data.noteDuration = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('noteDuration', val);
        }));

        this.data.sequence = 'C4 E4 G4 B4';
        this.addControl('sequence', new TextControl('seqSequence', 'Sequence', this.data.sequence, (val) => {
            this.data.sequence = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('sequence', val);
        }));

        this.data.showRandomSettings = false;
        this.addControl('randomSettingsToggle', new ButtonControl('randSettingsBtn', '🎲 Settings', () => {
            this.data.showRandomSettings = !this.data.showRandomSettings;
            const show = this.data.showRandomSettings;
            this.controls.randomizeMode.hidden = !show;
            this.controls.chordType.hidden = !show || (this.data.randomizeMode === 'Scale');
            this.controls.scaleType.hidden = !show || (this.data.randomizeMode === 'Chord');
            this.controls.rootNote.hidden = !show;
            this.controls.octaveRange.hidden = !show;
            this.controls.arpeggioPattern.hidden = !show;
            this.update();
        }));

        this.data.randomizeMode = this.data.randomizeMode || 'Chord';
        this.addControl('randomizeMode', new SelectControl('randModeSelect', 'Random Mode', ['Chord', 'Scale'], this.data.randomizeMode, (val) => {
            this.data.randomizeMode = val;
            this.controls.chordType.hidden = (val === 'Scale');
            this.controls.scaleType.hidden = (val === 'Chord');
            this.update();
            this.randomize();
        }));
        this.controls.randomizeMode.hidden = true;

        this.data.chordType = this.data.chordType || 'Major Triad';
        this.addControl('chordType', new SelectControl('chordTypeSelect', 'Chord Type', Object.keys(CHORD_TYPES), this.data.chordType, (val) => {
            this.data.chordType = val;
            this.randomize();
        }));
        this.controls.chordType.hidden = true;

        this.data.scaleType = this.data.scaleType || 'Major (Ionian)';
        this.addControl('scaleType', new SelectControl('scaleTypeSelect', 'Scale Type', Object.keys(SCALE_TYPES), this.data.scaleType, (val) => {
            this.data.scaleType = val;
            this.randomize();
        }));
        this.controls.scaleType.hidden = true;

        this.data.rootNote = this.data.rootNote || 'C4';
        this.addControl('rootNote', new SelectControl('rootNoteSelect', 'Root Note', Object.keys(ROOT_NOTES), this.data.rootNote, (val) => {
            this.data.rootNote = val;
            this.randomize();
        }));
        this.controls.rootNote.hidden = true;

        this.data.octaveRange = this.data.octaveRange || 0;
        this.addControl('octaveRange', new SliderControl('octaveRangeSlider', 'Octave Spread', 0, 3, 1, this.data.octaveRange, (val) => {
            this.data.octaveRange = val;
            this.randomize();
        }));
        this.controls.octaveRange.hidden = true;

        this.data.arpeggioPattern = this.data.arpeggioPattern || 'Random';
        this.addControl('arpeggioPattern', new SelectControl('arpPattern', 'Gen Pattern', ['Up', 'Down', 'Up-Down', 'Down-Up', 'Random'], this.data.arpeggioPattern, (val) => {
            this.data.arpeggioPattern = val;
            this.randomize();
        }));
        this.controls.arpeggioPattern.hidden = true;

        this.addControl('randomize', new ButtonControl('randomizeSeq', '🎲', () => {
            this.randomize();
        }));

        this.data.waveform = 'sine';
        this.addControl('waveform', new SelectControl('waveformSelect', 'Waveform', ['sine', 'square', 'sawtooth', 'triangle'], this.data.waveform, (val) => {
            this.data.waveform = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('waveform', val);
        }));

        this.data.showEnvelope = false;
        this.data.attack = 0.01;
        this.data.decay = 0.1;
        this.data.sustain = 0.5;
        this.data.release = 0.1;

        this.addControl('envelopeToggle', new ButtonControl('envelopeToggle', 'Envelope', () => {
            this.data.showEnvelope = !this.data.showEnvelope;
            this.controls.attack.hidden = !this.data.showEnvelope;
            this.controls.decay.hidden = !this.data.showEnvelope;
            this.controls.sustain.hidden = !this.data.showEnvelope;
            this.controls.release.hidden = !this.data.showEnvelope;
            this.update();
        }));

        this.addControl('attack', new SliderControl('seqAttack', 'Attack (s)', 0.01, 2, 0.01, this.data.attack, (val) => {
            this.data.attack = val;
        }));
        this.controls.attack.hidden = true;

        this.addControl('decay', new SliderControl('seqDecay', 'Decay (s)', 0.01, 2, 0.01, this.data.decay, (val) => {
            this.data.decay = val;
        }));
        this.controls.decay.hidden = true;

        this.addControl('sustain', new SliderControl('seqSustain', 'Sustain', 0, 1, 0.01, this.data.sustain, (val) => {
            this.data.sustain = val;
        }));
        this.controls.sustain.hidden = true;

        this.addControl('release', new SliderControl('seqRelease', 'Release (s)', 0.01, 5, 0.01, this.data.release, (val) => {
            this.data.release = val;
        }));
        this.controls.release.hidden = true;
    }

    randomize() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode) {
            const newSequence = audioNode.generateRandomSequence();
            this.controls.sequence.value = newSequence;
            this.data.sequence = newSequence;
            audioNode.updateParameter('sequence', newSequence);
            this.update();
        }
    }

    build() {
        return new Sequencer(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class ArpeggiatorNode extends AudioNode {
    constructor() {
        super('Arpeggiator');
        this.addInput('clock', new AudioPort(voltageSocket, 'Clock In'));
        this.addInput('midi', new AudioPort(midiSocket, 'MIDI In'));
        this.addInput('transpose_cv', new AudioPort(voltageSocket, 'Transpose CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));
        this.addOutput('midi', new AudioPort(midiSocket, 'MIDI Out'));

        this.data.bpm = 120;
        this.addControl('bpm', new SliderControl('arpBpm', 'BPM', 60, 240, 1, this.data.bpm, (val) => {
            this.data.bpm = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('bpm', val);
        }));

        this.data.noteDuration = '1/16';
        this.addControl('noteDuration', new SelectControl('arpNoteDuration', 'Note Duration', ['1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'], this.data.noteDuration, (val) => {
            this.data.noteDuration = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('noteDuration', val);
        }));

        this.data.chordType = 'Major Triad';
        this.addControl('chordType', new SelectControl('arpChordType', 'Chord Type', Object.keys(CHORD_TYPES), this.data.chordType, (val) => {
            this.data.chordType = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('chordType', val);
        }));

        this.data.rootNote = 'C4';
        const rootNoteOptions = Object.keys(ROOT_NOTES);
        this.addControl('rootNote', new SelectControl('arpRootNote', 'Root Note', rootNoteOptions, this.data.rootNote, (val) => {
            this.data.rootNote = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('rootNote', val);
        }));

        this.data.arpeggioPattern = 'Up';
        this.addControl('arpeggioPattern', new SelectControl('arpPattern', 'Pattern', ['Up', 'Down', 'Up-Down', 'Down-Up', 'Converge', 'Diverge', 'Alberti Bass', 'Chord', 'Melodic', 'Custom'], this.data.arpeggioPattern, (val) => {
            this.data.arpeggioPattern = val;
            this.controls.pattern.hidden = (val !== 'Custom');
            this.update();
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('arpeggioPattern', val);
        }));

        this.data.pattern = '0 1 2 3';
        this.addControl('pattern', new TextControl('arpPatternText', 'Pattern Indices', this.data.pattern, (val) => {
            this.data.pattern = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('pattern', val);
        }));
        this.controls.pattern.hidden = (this.data.arpeggioPattern !== 'Custom');

        this.addControl('randomize', new ButtonControl('randomizeArp', '🎲', () => {
            this.randomize();
        }));

        this.data.octaveRange = 1;
        this.addControl('octaveRange', new SliderControl('arpOctaveRange', 'Octaves', 1, 5, 1, this.data.octaveRange, (val) => {
            this.data.octaveRange = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('octaveRange', val);
        }));

        this.data.waveform = 'sine';
        this.addControl('waveform', new SelectControl('waveformSelect', 'Waveform', ['sine', 'square', 'sawtooth', 'triangle'], this.data.waveform, (val) => {
            this.data.waveform = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('waveform', val);
        }));

        this.data.showEnvelope = false;
        this.data.attack = 0.01;
        this.data.decay = 0.1;
        this.data.sustain = 0.5;
        this.data.release = 0.1;

        this.addControl('envelopeToggle', new ButtonControl('envelopeToggle', 'Envelope', () => {
            this.data.showEnvelope = !this.data.showEnvelope;
            this.controls.attack.hidden = !this.data.showEnvelope;
            this.controls.decay.hidden = !this.data.showEnvelope;
            this.controls.sustain.hidden = !this.data.showEnvelope;
            this.controls.release.hidden = !this.data.showEnvelope;
            this.update();
        }));

        this.addControl('attack', new SliderControl('arpAttack', 'Attack (s)', 0.01, 2, 0.01, this.data.attack, (val) => {
            this.data.attack = val;
        }));
        this.controls.attack.hidden = true;

        this.addControl('decay', new SliderControl('arpDecay', 'Decay (s)', 0.01, 2, 0.01, this.data.decay, (val) => {
            this.data.decay = val;
        }));
        this.controls.decay.hidden = true;

        this.addControl('sustain', new SliderControl('arpSustain', 'Sustain', 0, 1, 0.01, this.data.sustain, (val) => {
            this.data.sustain = val;
        }));
        this.controls.sustain.hidden = true;

        this.addControl('release', new SliderControl('arpRelease', 'Release (s)', 0.01, 5, 0.01, this.data.release, (val) => {
            this.data.release = val;
        }));
        this.controls.release.hidden = true;
    }

    randomize() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode) {
            const chordOffsets = CHORD_TYPES[this.data.chordType] || CHORD_TYPES['Major Triad'];
            const octaveRange = this.data.octaveRange || 1;
            const numNotes = chordOffsets.length * octaveRange;

            let indices = [];
            for (let i = 0; i < 16; i++) {
                indices.push(Math.floor(Math.random() * numNotes));
            }
            const newPattern = indices.join(' ');
            this.controls.pattern.value = newPattern;
            this.data.pattern = newPattern;
            audioNode.updateParameter('pattern', newPattern);
            this.update();
        }
    }

    build() {
        return new Arpeggiator(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class MasterClockNode extends AudioNode {
    constructor() {
        super('Master Clock');
        this.addOutput('clock', new AudioPort(voltageSocket, 'Clock Out'));

        this.addControl('indicator', new IndicatorControl('indicator', 'Clock Pulse'));

        this.data.bpm = 120;
        this.addControl('bpm', new SliderControl('mcBpm', 'BPM', 30, 240, 1, this.data.bpm, (val) => {
            this.data.bpm = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('bpm', val);
            if (this.data.running) {
                this.startBlinker();
            }
        }));

        this.data.running = false;
        this.addControl('running', new ButtonControl('runningBtn', 'Start', async () => {
            if (!window.audioContext || window.audioContext.state !== 'running') {
                if (window.startAudio) await window.startAudio();
            }

            this.data.running = !this.data.running;
            this.controls.running.label = this.data.running ? 'Stop' : 'Start';
            if (this.data.running) {
                this.start();
            } else {
                this.stop();
            }
            this.update();
        }));
    }

    build() {
        return new MasterClock(window.audioContext, this.id, this.data);
    }

    startBlinker() {
        this.stopBlinker();
        this.blinkInterval = setInterval(() => {
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.started) {
                const indicator = document.querySelector(`[data-node-id='${this.id}'] .clock-indicator`);
                if (indicator) {
                    indicator.classList.add('blinking');
                    setTimeout(() => indicator.classList.remove('blinking'), 50);
                }
            }
        }, 1000 / ((this.data.bpm || 120) / 60));
    }

    stopBlinker() {
        if (this.blinkInterval) {
            clearInterval(this.blinkInterval);
            this.blinkInterval = null;
        }
    }

    start() {
        this.data.running = true;
        this.controls.running.label = 'Stop';
        this.update();

        const audioNode = audioNodes.get(this.id);
        if (audioNode && !audioNode.started) {
            audioNode.start();
        }
        this.startBlinker();
    }

    stop() {
        this.data.running = false;
        this.controls.running.label = 'Start';
        this.update();

        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.started) {
            audioNode._internalStop();
        }
        this.stopBlinker();
    }
}

class ManualGateNode extends AudioNode {
    constructor() {
        super('Manual Gate');
        this.addOutput('out', new AudioPort(voltageSocket, 'Gate Out'));

        this.data.value = false;
        this.addControl('value', new ButtonControl('valueBtn', 'Low', () => {
            this.data.value = !this.data.value;
            this.controls.value.label = this.data.value ? 'High' : 'Low';
            const audioNode = audioNodes.get(this.id);
            if (audioNode) {
                audioNode.updateParameter('value', this.data.value);
            }
            this.update();
        }));
    }

    build() {
        return new ManualGate(window.audioContext, this.id, this.data);
    }
     start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class QuantizerNode extends AudioNode {
    constructor() {
        super('Quantizer');
        this.addInput('in', new AudioPort(voltageSocket, 'CV In'));
        this.addOutput('out', new AudioPort(voltageSocket, 'CV Out'));

        this.data.rootNote = 'C4';
        this.addControl('rootNote', new SelectControl('quantRootNote', 'Root Note', Object.keys(ROOT_NOTES), this.data.rootNote, (val) => {
            this.data.rootNote = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('rootNote', val);
        }));

        this.data.scaleType = 'Major (Ionian)';
        this.addControl('scaleType', new SelectControl('quantScaleType', 'Scale', Object.keys(SCALE_TYPES), this.data.scaleType, (val) => {
            this.data.scaleType = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('scaleType', val);
        }));
    }

    build() {
        return new Quantizer(window.audioContext, this.id, this.data);
    }
}

class AttenuverterNode extends AudioNode {
    constructor() {
        super('Attenuverter');
        this.addInput('in', new AudioPort(voltageSocket, 'In'));
        this.addOutput('out', new AudioPort(voltageSocket, 'Out'));

        this.data.level = 1;
        this.addControl('level', new SliderControl('levelSlider', 'Level', -1, 1, 0.01, this.data.level, (val) => {
            this.data.level = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.gain) {
                audioNode.gain.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));
    }

    build() {
        const audioNode = window.audioContext.createGain();
        audioNode.gain.value = this.data.level;
        return audioNode;
    }
}

class MicrophoneInputNode extends AudioNode {
    constructor() {
        super('🎤 Mic Input');
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));

        this.addControl('mic', new ButtonControl('micButton', '🎤 Activate Mic', async () => {
            if (!window.audioContext || window.audioContext.state !== 'running') {
                if (window.startAudio) await window.startAudio();
            }
            const audioNode = audioNodes.get(this.id);
            if (audioNode) {
                try {
                    if (audioNode.micStream) {
                        audioNode.deactivateMic();
                        this.controls.mic.label = '🎤 Activate Mic';
                    } else {
                        await audioNode.activateMic();
                        this.controls.mic.label = '🎤 Deactivate';
                    }
                } catch (e) {
                    this.controls.mic.label = '🎤 Activate Mic';
                } finally {
                    this.update();
                }
            }
        }));
    }

    build() {
        return new MicrophoneInput(window.audioContext, this.id, this.data);
    }
}

class GranularSynthesizerNode extends AudioNode {
    constructor() {
        super('Granular Synthesizer');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addInput('grainSizeCV', new AudioPort(voltageSocket, 'Grain Size CV'));
        this.addInput('grainDensityCV', new AudioPort(voltageSocket, 'Grain Density CV'));
        this.addInput('pitchShiftCV', new AudioPort(voltageSocket, 'Pitch Shift CV'));
        this.addInput('positionJitterCV', new AudioPort(voltageSocket, 'Jitter CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.grainSize = 0.1;
        this.addControl('grainSize', new SliderControl('grainSize', 'Grain Size (s)', 0.01, 0.5, 0.001, this.data.grainSize, (val) => {
            this.data.grainSize = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('grainSize', val);
        }));

        this.data.grainDensity = 20;
        this.addControl('grainDensity', new SliderControl('grainDensity', 'Grain Density (Hz)', 1, 100, 1, this.data.grainDensity, (val) => {
            this.data.grainDensity = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('grainDensity', val);
        }));

        this.data.pitchShift = 0;
        this.addControl('pitchShift', new SliderControl('pitchShift', 'Pitch Shift (cents)', -2400, 2400, 1, this.data.pitchShift, (val) => {
            this.data.pitchShift = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('pitchShift', val);
        }));

        this.data.positionJitter = 0;
        this.addControl('positionJitter', new SliderControl('positionJitter', 'Position Jitter', 0, 1, 0.01, this.data.positionJitter, (val) => {
            this.data.positionJitter = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('positionJitter', val);
        }));
    }

    build() {
        return new GranularSynthesizer(window.audioContext, this.id, this.data);
    }
}

class DrumMachineNode extends AudioNode {
    constructor() {
        super('Drum Machine');
        this.addInput('clock', new AudioPort(voltageSocket, 'Clock In'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));

        this.data.bpm = 120;
        this.addControl('bpm', new SliderControl('dmBpm', 'BPM', 60, 240, 1, this.data.bpm, (val) => {
            this.data.bpm = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('bpm', val);
        }));

        this.data.noteDuration = '1/16';
        this.addControl('noteDuration', new SelectControl('dmNoteDuration', 'Note Duration', ['1', '1/2', '1/4', '1/8', '1/16', '1/32', '1/64', '1/128'], this.data.noteDuration, (val) => {
            this.data.noteDuration = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('noteDuration', val);
        }));

        this.data.sequence = 'k s h s';
        this.addControl('sequence', new TextControl('dmSequence', 'Sequence', this.data.sequence, (val) => {
            this.data.sequence = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.updateParameter) audioNode.updateParameter('sequence', val);
        }));

        this.addControl('randomize', new ButtonControl('randomizeDm', '🎲', () => {
            const audioNode = audioNodes.get(this.id);
            if (audioNode) {
                const newSequence = audioNode.generateRandomSequence();
                this.controls.sequence.value = newSequence;
                this.data.sequence = newSequence;
                audioNode.updateParameter('sequence', newSequence);
                this.update();
            }
        }));
    }

    build() {
        return new DrumMachine(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

class VocoderNode extends AudioNode {
    constructor() {
        super('Vocoder');
        this.addInput('carrier', new AudioPort(voltageSocket, 'Carrier In'));
        this.addInput('modulator', new AudioPort(voltageSocket, 'Modulator In'));
        this.addInput('bands_cv', new AudioPort(voltageSocket, 'Bands CV'));
        this.addInput('formant_cv', new AudioPort(voltageSocket, 'Formant CV'));
        this.addInput('unvoiced_cv', new AudioPort(voltageSocket, 'Unvoiced CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.frequency = 110;
        this.addControl('frequency', new SliderControl('freqSlider', 'Carrier Freq', 50, 1000, 1, this.data.frequency, (val) => {
            this.data.frequency = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('frequency', val);
        }));

        this.data.waveform = 'sawtooth';
        this.addControl('waveform', new SelectControl('waveformSelect', 'Carrier Wave', ['sine', 'square', 'sawtooth', 'triangle'], this.data.waveform, (val) => {
            this.data.waveform = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('waveform', val);
        }));

        this.data.numBands = 16;
        this.addControl('numBands', new SliderControl('bandsSlider', 'Bands', 8, 40, 1, this.data.numBands, (val) => {
            this.data.numBands = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('numBands', val);
        }));

        this.data.formantShift = 0;
        this.addControl('formantShift', new SliderControl('formantSlider', 'Formant Shift (cents)', -1200, 1200, 1, this.data.formantShift, (val) => {
            this.data.formantShift = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.formantShift) audioNode.formantShift.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
        }));

        this.data.unvoicedLevel = 0.5;
        this.addControl('unvoicedLevel', new SliderControl('unvoicedSlider', 'Unvoiced Level', 0, 1, 0.01, this.data.unvoicedLevel, (val) => {
            this.data.unvoicedLevel = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.unvoicedLevel) audioNode.unvoicedLevel.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
        }));

        this.data.modulatorGain = 1;
        this.addControl('modulatorGain', new SliderControl('modulatorGainSlider', 'Modulator Gain', 0, 10, 0.1, this.data.modulatorGain, (val) => {
            this.data.modulatorGain = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode) audioNode.updateParameter('modulatorGain', val);
        }));
    }

    build() {
        return new Vocoder(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            audioNode.start();
        }
    }

    stop() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.stop && audioNode.started) {
            audioNode.stop();
        }
    }
}

class ChordGeneratorNode extends AudioNode {
    constructor() {
        super('Chord Generator');

        this.addInput('midi', new AudioPort(midiSocket, 'MIDI In'));
        this.addInput('transpose_cv', new AudioPort(voltageSocket, 'Transpose CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio'));

        this.data.chordType = 'Major Triad';
        this.data.rootNote = 'C4';
        this.data.octaveRange = 0;
        this.data.waveform = 'sine';

        this.addControl('chordType', new SelectControl('chordTypeSelect', 'Chord Type', Object.keys(CHORD_TYPES), this.data.chordType, (val) => {
            this.data.chordType = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ChordGenerator) {
                audioNode.updateParameter('chordType', val);
            }
        }));

        this.addControl('rootNote', new SelectControl('rootNoteSelect', 'Root Note', Object.keys(ROOT_NOTES), this.data.rootNote, (val) => {
            this.data.rootNote = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ChordGenerator) {
                audioNode.updateParameter('rootNote', val);
            }
        }));

        this.addControl('octaveRange', new SliderControl('octaveRangeSlider', 'Octave Offset', -3, 3, 1, this.data.octaveRange, (val) => {
            this.data.octaveRange = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ChordGenerator) {
                audioNode.updateParameter('octaveRange', val);
            }
        }));

        this.addControl('waveform', new SelectControl('waveformSelect', 'Waveform', ['sine', 'square', 'sawtooth', 'triangle'], this.data.waveform, (val) => {
            this.data.waveform = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode instanceof ChordGenerator) {
                audioNode.updateParameter('waveform', val);
            }
        }));
    }

    build() {
        return new ChordGenerator(window.audioContext, this.id, this.data);
    }

    start() {
        const audioNode = audioNodes.get(this.id);
        if (audioNode && audioNode.start && !audioNode.started) {
            try {
                audioNode.start();
                audioNode.started = true;
            } catch (e) {
                console.warn(`Could not start ${this.label} for node ${this.id}:`, e);
            }
        }
    }
}

// Register nodes in NodeRegistry
NodeRegistry.register('Tone Generator', ToneGeneratorNode);
NodeRegistry.register('Noise Generator', NoiseGeneratorNode);
NodeRegistry.register('Wave Player', WavePlayerNode);
NodeRegistry.register('Filter', FilterNode);
NodeRegistry.register('Delay', DelayNode);
NodeRegistry.register('Reverb', ReverbNode);
NodeRegistry.register('Distortion', DistortionNode);
NodeRegistry.register('Compressor', CompressorNode);
NodeRegistry.register('VCA', VCANode);
NodeRegistry.register('Mixer', MixerNode);
NodeRegistry.register('Master', MasterGainOutputNode);
NodeRegistry.register('LFO', LFONode);
NodeRegistry.register('Bitcrusher', BitcrusherNode);
NodeRegistry.register('ADSR Envelope', ADSREnvelopeNode);
NodeRegistry.register('Sequencer', SequencerNode);
NodeRegistry.register('Arpeggiator', ArpeggiatorNode);
NodeRegistry.register('Master Clock', MasterClockNode);
NodeRegistry.register('Manual Gate', ManualGateNode);
NodeRegistry.register('Quantizer', QuantizerNode);
NodeRegistry.register('Attenuverter', AttenuverterNode);
NodeRegistry.register('🎤 Mic Input', MicrophoneInputNode);
NodeRegistry.register('Granular Synthesizer', GranularSynthesizerNode);
NodeRegistry.register('Drum Machine', DrumMachineNode);
NodeRegistry.register('Vocoder', VocoderNode);
NodeRegistry.register('Chord Generator', ChordGeneratorNode);

// Export to window
window.ToneGeneratorNode = ToneGeneratorNode;
window.NoiseGeneratorNode = NoiseGeneratorNode;
window.WavePlayerNode = WavePlayerNode;
window.FilterNode = FilterNode;
window.DelayNode = DelayNode;
window.ReverbNode = ReverbNode;
window.DistortionNode = DistortionNode;
window.CompressorNode = CompressorNode;
window.VCANode = VCANode;
window.MixerNode = MixerNode;
window.MasterGainOutputNode = MasterGainOutputNode;
window.LFONode = LFONode;
window.BitcrusherNode = BitcrusherNode;
window.ADSREnvelopeNode = ADSREnvelopeNode;
window.SequencerNode = SequencerNode;
window.ArpeggiatorNode = ArpeggiatorNode;
window.MasterClockNode = MasterClockNode;
window.ManualGateNode = ManualGateNode;
window.QuantizerNode = QuantizerNode;
window.AttenuverterNode = AttenuverterNode;
window.MicrophoneInputNode = MicrophoneInputNode;
window.GranularSynthesizerNode = GranularSynthesizerNode;
window.DrumMachineNode = DrumMachineNode;
window.VocoderNode = VocoderNode;
window.ChordGeneratorNode = ChordGeneratorNode;

class StereoPannerNode extends AudioNode {
    constructor() {
        super('Stereo Panner');
        this.addInput('audio', new AudioPort(voltageSocket, 'Audio In'));
        this.addInput('pan_cv', new AudioPort(voltageSocket, 'Pan CV'));
        this.addOutput('audio', new AudioPort(voltageSocket, 'Audio Out'));

        this.data.pan = 0;
        this.addControl('pan', new SliderControl('panSlider', 'Pan', -1, 1, 0.01, this.data.pan, (val) => {
            this.data.pan = val;
            const audioNode = audioNodes.get(this.id);
            if (audioNode && audioNode.pan) {
                audioNode.pan.setTargetAtTime(val, window.audioContext.currentTime, 0.01);
            }
        }));
    }

    build() {
        const audioNode = window.audioContext.createStereoPanner();
        audioNode.pan.value = this.data.pan !== undefined ? this.data.pan : 0;
        return audioNode;
    }
}

NodeRegistry.register('Stereo Panner', StereoPannerNode);
window.StereoPannerNode = StereoPannerNode;
