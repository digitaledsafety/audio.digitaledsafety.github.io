/**
 * Audio Engine classes and utilities for the Audio project.
 */

function midiToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function applyADSR(gainNode, adsrData, durationSeconds, audioContext, maxGain = 1.0, startTime) {
    const now = startTime || audioContext.currentTime;
    const gainParam = gainNode.gain;

    const attackDuration = Math.max(0.001, adsrData.attack || 0.01);
    const decayDuration = Math.max(0.001, adsrData.decay || 0.1);
    const sustainLevel = (adsrData.sustain !== undefined ? adsrData.sustain : 0.5) * maxGain;
    const releaseDuration = Math.max(0.001, adsrData.release || 0.1);

    gainParam.cancelScheduledValues(now);
    gainParam.setValueAtTime(0, now);

    gainParam.linearRampToValueAtTime(maxGain, now + attackDuration);
    gainParam.linearRampToValueAtTime(sustainLevel, now + attackDuration + decayDuration);

    const releaseStartTime = now + durationSeconds - releaseDuration;
    if (releaseStartTime > now + attackDuration + decayDuration) {
        gainParam.setValueAtTime(sustainLevel, releaseStartTime);
        gainParam.linearRampToValueAtTime(0, releaseStartTime + releaseDuration);
    } else {
        gainParam.linearRampToValueAtTime(0, now + durationSeconds);
    }
}

function generateImpulseResponse(audioContext, duration, decay) {
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = length - i;
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
    return impulse;
}

function makeDistortionCurve(amount, drive) {
    const k = typeof amount === 'number' ? amount : 50;
    const d = typeof drive === 'number' ? drive : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * (20 + d) * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

function setDistortionCurve(waveShaperNode, amount, drive) {
    if (waveShaperNode && waveShaperNode.curve) {
        waveShaperNode.curve = makeDistortionCurve(amount, drive);
    }
}

function migrateV1ToV2(workspaceData) {
    const updatedData = JSON.parse(JSON.stringify(workspaceData));

    // Define a map for the primary audio input key for each node type.
    const primaryInputMap = {
        'VCA': 'audio',
        'Master': 'audio',
        'Filter': 'audio',
        'Delay': 'audio',
        'Distortion': 'audio',
        'Compressor': 'audio',
        'Reverb': 'audio',
        'Bitcrusher': 'audio',
        'Vocoder': 'modulator', // Default to modulator, as it's the most common use case
        'Granular Synthesizer': 'audio',
        'Mixer': 'in1' // Default to the first input for mixers
    };

    if (updatedData.connections) {
        for (const connection of updatedData.connections) {
            // Only migrate connections that were incorrectly saved with the generic 'voltage' key.
            if (connection.targetInput === 'voltage') {
                const targetNodeData = updatedData.nodes.find(n => n.id === connection.target);
                if (targetNodeData && primaryInputMap[targetNodeData.label]) {
                    connection.targetInput = primaryInputMap[targetNodeData.label];
                } else {
                    console.warn(`Could not determine primary input for node type "${targetNodeData ? targetNodeData.label : 'Unknown'}" during migration. Connection may be incorrect.`);
                    // As a last resort, fall back to a common default like 'audio'.
                    connection.targetInput = 'audio';
                }
            }
        }
    }
    updatedData.workspaceFormatVersion = '2.0';
    return updatedData;
}

// --- Audio Engine Classes ---

class ChordGenerator {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.oscillators = [];
        this.gainNodes = [];
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = 0.5;
        this.transposeControl = this.audioContext.createGain();
        this.transposeControl.gain.value = 1200;
        this.setupNotesAndChords();
        this.updateParameter('chordType', this.data.chordType || 'Major Triad');
        this.updateParameter('rootNote', this.data.rootNote || 'C4');
        this.updateParameter('octaveRange', this.data.octaveRange || 0);
        this.updateParameter('waveform', this.data.waveform || 'sine');
    }

    receiveMidiNotes(notes) {
        if (notes && notes.length > 0) {
            const firstNote = notes[0];
            let closestNoteName = 'C4';
            let minDiff = Infinity;
            for (const noteName in ROOT_NOTES) {
                const diff = Math.abs(ROOT_NOTES[noteName] - firstNote);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestNoteName = noteName;
                }
            }
            this.updateParameter('rootNote', closestNoteName);
            const node = editor.getNode(this.reteNodeId);
            if (node && node.controls.rootNote) {
                node.controls.rootNote.value = closestNoteName;
                node.update();
            }
        }
    }

    setupNotesAndChords() {
        this.chordTypes = CHORD_TYPES;
        this.rootNotes = ROOT_NOTES;
    }

    getChordNotes() {
        const chordIntervals = this.chordTypes[this.data.chordType] || this.chordTypes['Major Triad'];
        const rootMidi = this.rootNotes[this.data.rootNote] || this.rootNotes['C4'];
        const octaveAdjustment = (this.data.octaveRange || 0) * 12;
        return chordIntervals.map(interval => rootMidi + interval + octaveAdjustment);
    }

    start() {
        if (this.started) this.stop();
        const notesToPlay = this.getChordNotes();
        notesToPlay.forEach(midiNote => {
            const freq = midiToFrequency(midiNote);
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.frequency.value = freq;
            osc.type = this.data.waveform || 'sine';
            this.transposeControl.connect(osc.detune);
            gain.gain.value = 1 / notesToPlay.length;
            osc.connect(gain);
            gain.connect(this.mainOutput);
            osc.start();
            this.oscillators.push(osc);
            this.gainNodes.push(gain);
        });
        this.started = true;
    }

    stop() {
        this.oscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) {}
        });
        this.gainNodes.forEach(gain => gain.disconnect());
        this.oscillators = [];
        this.gainNodes = [];
        this.started = false;
    }

    updateParameter(paramName, value) {
        this.data[paramName] = value;
        if (this.started && ['chordType', 'rootNote', 'octaveRange', 'waveform'].includes(paramName)) {
            this.start();
        }
    }
}

class ManualGate {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.gateListeners = [];
        this.source = this.audioContext.createConstantSource();
        this.source.offset.value = this.data.value ? 1 : 0;
        this.mainOutput = this.source;
    }
    addGateListener(callback) { if (!this.gateListeners.includes(callback)) this.gateListeners.push(callback); }
    removeGateListener(callback) { this.gateListeners = this.gateListeners.filter(c => c !== callback); }
    start() { if (!this.started) { this.source.start(0); this.started = true; } }
    stop() {}
    updateParameter(paramName, value) {
        this.data[paramName] = value;
        if (paramName === 'value') {
            this.source.offset.value = value ? 1.0 : 0.0;
            this.gateListeners.forEach(l => l(value));
        }
    }
}

class MicrophoneInput {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.micStream = null;
        this.micSource = null;
        this.mainOutput = this.audioContext.createGain();
    }
    async activateMic() {
        if (!this.micStream) {
            this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micSource = this.audioContext.createMediaStreamSource(this.micStream);
            this.micSource.connect(this.mainOutput);
        }
    }
    deactivateMic() {
        if (this.micStream) {
            this.micStream.getTracks().forEach(t => t.stop());
            this.micStream = null;
        }
    }
    start() {}
    stop() { this.deactivateMic(); }
}

class NoiseGenerator {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        const bufferSize = 2 * this.audioContext.sampleRate;
        const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = noiseBuffer;
        this.source.loop = true;
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = this.data.gainValue !== undefined ? this.data.gainValue : 1;
        this.source.connect(this.mainOutput);
    }
    start() { if (!this.started) { this.source.start(0); this.started = true; } }
    stop() { if (this.started) { this.source.stop(0); this.started = false; } }
    updateParameter(paramName, value) {
        this.data[paramName] = value;
        if (paramName === 'gainValue') this.mainOutput.gain.value = value;
    }
}

class WavePlayer {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.audioBuffer = null;
        this.mainOutput = this.audioContext.createGain();
        this.loadAudio();
    }
    async loadAudio() {
        if (!this.data.audioUrl) return;
        const response = await fetch(this.data.audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    }
    play() {
        if (!this.audioBuffer) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(this.mainOutput);
        source.start(0);
    }
    updateParameter(paramName, value) {
        this.data[paramName] = value;
        if (paramName === 'audioUrl') this.loadAudio();
    }
}

class Mixer {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.mainOutput = this.audioContext.createGain();
        this.in1Input = this.audioContext.createGain();
        this.in2Input = this.audioContext.createGain();
        this.in3Input = this.audioContext.createGain();
        this.in4Input = this.audioContext.createGain();
        this.in1Input.connect(this.mainOutput);
        this.in2Input.connect(this.mainOutput);
        this.in3Input.connect(this.mainOutput);
        this.in4Input.connect(this.mainOutput);
        this.updateParameter('gain1', this.data.gain1 !== undefined ? this.data.gain1 : 0.8);
        this.updateParameter('gain2', this.data.gain2 !== undefined ? this.data.gain2 : 0.8);
        this.updateParameter('gain3', this.data.gain3 !== undefined ? this.data.gain3 : 0.8);
        this.updateParameter('gain4', this.data.gain4 !== undefined ? this.data.gain4 : 0.8);
    }
    updateParameter(paramName, value) {
        this.data[paramName] = value;
        if (this[paramName + 'Input']) this[paramName + 'Input'].gain.setTargetAtTime(value, this.audioContext.currentTime, 0.01);
    }
    start() {}
    stop() {}
}

class Arpeggiator {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.currentNoteIndex = 0;
        this.nextStepTime = 0;
        this.midiListeners = [];
        this.tickCount = 0;
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = 0.5;
        this.transposeControl = this.audioContext.createGain();
        this.transposeControl.gain.value = 1200;
        this.setupNotesAndChords();
    }
    receiveMidiNotes(notes) {
        if (notes && notes.length > 0) {
            let closestNoteName = 'C4';
            let minDiff = Infinity;
            for (const name in ROOT_NOTES) {
                const diff = Math.abs(ROOT_NOTES[name] - notes[0]);
                if (diff < minDiff) { minDiff = diff; closestNoteName = name; }
            }
            this.updateParameter('rootNote', closestNoteName);
            const node = editor.getNode(this.reteNodeId);
            if (node && node.controls.rootNote) { node.controls.rootNote.value = closestNoteName; node.update(); }
        }
    }
    addMidiListener(cb) { this.midiListeners.push(cb); }
    removeMidiListener(cb) { this.midiListeners = this.midiListeners.filter(l => l !== cb); }
    onTick(tickTime, tickDuration) {
        const noteDurationMap = { '1': 96, '1/2': 48, '1/4': 24, '1/8': 12, '1/16': 6, '1/32': 3, '1/64': 1.5, '1/128': 0.75 };
        const ticksPerStep = noteDurationMap[this.data.noteDuration] || 6;
        if (this.tickCount % ticksPerStep === 0) {
            const notes = this.getArpeggioNotes();
            if (notes.length > 0) {
                const currentStep = notes[this.currentNoteIndex];
                const stepDuration = tickDuration * ticksPerStep;
                this.scheduleNote(currentStep, stepDuration * 0.9, tickTime);
                if (this.midiListeners.length > 0) {
                    const midiNotes = Array.isArray(currentStep) ? currentStep : [currentStep];
                    this.midiListeners.forEach(l => l(midiNotes));
                }
                this.currentNoteIndex = (this.currentNoteIndex + 1) % notes.length;
            }
        }
        this.tickCount++;
    }
    setupNotesAndChords() { this.chordTypes = CHORD_TYPES; this.rootNotes = ROOT_NOTES; }
    getArpeggioNotes() {
        const rootMidi = this.rootNotes[this.data.rootNote] || 60;
        const chordOffsets = this.chordTypes[this.data.chordType] || this.chordTypes['Major Triad'];
        const octaveRange = this.data.octaveRange || 1;
        let arpeggioNotes = [];
        for (let oct = 0; oct < octaveRange; oct++) chordOffsets.forEach(o => arpeggioNotes.push(rootMidi + o + oct * 12));
        arpeggioNotes.sort((a, b) => a - b);
        if (this.data.arpeggioPattern === 'Down') return [...arpeggioNotes].reverse();
        if (this.data.arpeggioPattern === 'Random') return arpeggioNotes.sort(() => Math.random() - 0.5);
        return arpeggioNotes;
    }
    scheduleNote(midiNotes, duration, startTime) {
        const now = startTime || this.audioContext.currentTime;
        const notesToPlay = Array.isArray(midiNotes) ? midiNotes : [midiNotes];
        notesToPlay.forEach(midiNote => {
            const freq = midiToFrequency(midiNote);
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = this.data.waveform || 'sine';
            osc.frequency.setValueAtTime(freq, now);
            this.transposeControl.connect(osc.detune);
            applyADSR(gain, this.data, duration, this.audioContext, 0.3 / notesToPlay.length, now);
            osc.connect(gain); gain.connect(this.mainOutput);
            osc.start(now); osc.stop(now + duration);
        });
    }
    start() { if (!this.started) { this.started = true; this.currentNoteIndex = 0; this.nextStepTime = this.audioContext.currentTime; this.schedule(); } }
    schedule() {
        if (!this.started) return;
        const hasClock = editor.getConnections().some(c => c.target === this.reteNodeId && c.targetInput === 'clock');
        if (hasClock) { setTimeout(() => this.schedule(), 100); return; }
        const notes = this.getArpeggioNotes();
        if (notes.length === 0) { this.stop(); return; }
        const bpm = this.data.bpm || 120;
        const noteDurationMap = { '1': 4, '1/2': 2, '1/4': 1, '1/8': 0.5, '1/16': 0.25, '1/32': 0.125, '1/64': 0.0625, '1/128': 0.03125 };
        const stepDuration = (60.0 / bpm) * (noteDurationMap[this.data.noteDuration] || 0.25);
        while (this.nextStepTime < this.audioContext.currentTime + 0.1) {
            this.scheduleNote(notes[this.currentNoteIndex], stepDuration, this.nextStepTime);
            this.nextStepTime += stepDuration;
            this.currentNoteIndex = (this.currentNoteIndex + 1) % notes.length;
        }
        setTimeout(() => this.schedule(), 25);
    }
    stop() { this.started = false; }
    updateParameter(p, v) { this.data[p] = v; if (this.started) { this.stop(); this.start(); } }
}

class DrumMachine {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.currentStep = 0;
        this.tickCount = 0;
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = 0.8;
        this.parser = new MiniNotationParser({ 'k': 60, 's': 62, 'h': 64 });
        this.sequenceEvents = this.parser.parse(this.data.sequence || '');
    }
    onTick(tickTime, tickDuration) {
        const noteDurationMap = { '1': 96, '1/2': 48, '1/4': 24, '1/8': 12, '1/16': 6, '1/32': 3, '1/64': 1.5, '1/128': 0.75 };
        const baseTicks = noteDurationMap[this.data.noteDuration] || 6;
        const event = this.sequenceEvents[this.currentStep];
        if (event) {
            const representative = Array.isArray(event) ? event[0] : event;
            const ticksForThisStep = baseTicks * (1 / representative.speed) * representative.duration;
            if (this.tickCount % ticksForThisStep === 0) {
                if (Array.isArray(event)) event.forEach(n => { if (n.noteName) this.scheduleNote(n.noteName, tickDuration * ticksForThisStep * n.elongation, tickTime); });
                else if (event.noteName) this.scheduleNote(event.noteName, tickDuration * baseTicks * event.elongation, tickTime);
                this.currentStep = (this.currentStep + 1) % this.sequenceEvents.length;
            }
        }
        this.tickCount++;
    }
    scheduleNote(type, duration, now) {
        if (type === 'k') this.createKick(now);
        if (type === 's') this.createSnare(now);
        if (type === 'h') this.createHiHat(now);
    }
    createKick(now) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain); gain.connect(this.mainOutput);
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now); osc.stop(now + 0.5);
    }
    createSnare(now) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'triangle'; osc.frequency.value = 180;
        osc.connect(gain); gain.connect(this.mainOutput);
        gain.gain.setValueAtTime(1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    }
    createHiHat(now) {
        const noise = this.audioContext.createBufferSource();
        const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.05, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const gain = this.audioContext.createGain();
        noise.connect(gain); gain.connect(this.mainOutput);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        noise.start(now); noise.stop(now + 0.05);
    }
    start() {}
    stop() {}
    updateParameter(p, v) { this.data[p] = v; if (p === 'sequence') this.sequenceEvents = this.parser.parse(v); }
    generateRandomSequence() { return ['k ~ h ~', 'k s h s', 'k ~ ~ h'].sort(() => Math.random() - 0.5)[0]; }
}

class Sequencer {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.currentStep = 0;
        this.tickCount = 0;
        this.midiListeners = [];
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = 0.5;
        this.transposeControl = this.audioContext.createGain();
        this.transposeControl.gain.value = 1200;
        this.parser = new MiniNotationParser(ROOT_NOTES);
        this.sequenceEvents = this.parser.parse(this.data.sequence || '');
    }
    addMidiListener(cb) { this.midiListeners.push(cb); }
    removeMidiListener(cb) { this.midiListeners = this.midiListeners.filter(l => l !== cb); }
    onTick(tickTime, tickDuration) {
        const noteDurationMap = { '1': 96, '1/2': 48, '1/4': 24, '1/8': 12, '1/16': 6, '1/32': 3, '1/64': 1.5, '1/128': 0.75 };
        const ticksPerStep = noteDurationMap[this.data.noteDuration] || 6;
        if (this.tickCount % ticksPerStep === 0) {
            const event = this.sequenceEvents[this.currentStep];
            if (event) {
                const stepDuration = tickDuration * ticksPerStep;
                const midiNotes = [];
                if (Array.isArray(event)) event.forEach(n => { if (n.midi !== null) { this.scheduleNote(n.midi, stepDuration * 0.9, tickTime); midiNotes.push(n.midi); } });
                else if (event.midi !== null) { this.scheduleNote(event.midi, stepDuration * 0.9, tickTime); midiNotes.push(event.midi); }
                if (this.midiListeners.length > 0 && midiNotes.length > 0) this.midiListeners.forEach(l => l(midiNotes));
                this.currentStep = (this.currentStep + 1) % this.sequenceEvents.length;
            }
        }
        this.tickCount++;
    }
    scheduleNote(midiNote, duration, now) {
        const freq = midiToFrequency(midiNote);
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = this.data.waveform || 'sine';
        osc.frequency.setValueAtTime(freq, now);
        this.transposeControl.connect(osc.detune);
        applyADSR(gain, this.data, duration, this.audioContext, 0.3, now);
        osc.connect(gain); gain.connect(this.mainOutput);
        osc.start(now); osc.stop(now + duration);
    }
    start() { if (!this.started) { this.started = true; this.currentStep = 0; this.nextStepTime = this.audioContext.currentTime; this.schedule(); } }
    schedule() {
        if (!this.started) return;
        const hasClock = editor.getConnections().some(c => c.target === this.reteNodeId && c.targetInput === 'clock');
        if (hasClock) { setTimeout(() => this.schedule(), 100); return; }
        if (!this.sequenceEvents || this.sequenceEvents.length === 0) return;
        const bpm = this.data.bpm || 120;
        const noteDurationMap = { '1': 1, '1/2': 0.5, '1/4': 0.25, '1/8': 0.125, '1/16': 0.0625 };
        const baseDuration = noteDurationMap[this.data.noteDuration] || 0.25;
        while (this.nextStepTime < this.audioContext.currentTime + 0.1) {
            const event = this.sequenceEvents[this.currentStep];
            const representative = Array.isArray(event) ? event[0] : event;
            const stepDuration = (60.0 / bpm) * 4 * baseDuration * (representative ? (1 / representative.speed) * representative.duration : 1);
            if (event) {
                if (Array.isArray(event)) event.forEach(n => { if (n.midi !== null) this.scheduleNote(n.midi, stepDuration * n.elongation, this.nextStepTime); });
                else if (event.midi !== null) this.scheduleNote(event.midi, stepDuration * event.elongation, this.nextStepTime);
            }
            this.nextStepTime += stepDuration;
            this.currentStep = (this.currentStep + 1) % this.sequenceEvents.length;
        }
        setTimeout(() => this.schedule(), 25);
    }
    stop() { this.started = false; }
    updateParameter(p, v) { this.data[p] = v; if (p === 'sequence') this.sequenceEvents = this.parser.parse(v); if (this.started) { this.stop(); this.start(); } }
    generateRandomSequence() { return "C4 E4 G4 B4"; }
}

class MasterClock {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.stopping = false;
        this.tickListeners = [];
        this.beatCount = 0;
    }
    addTickListener(cb) { this.tickListeners.push(cb); }
    removeTickListener(cb) { this.tickListeners = this.tickListeners.filter(l => l !== cb); }
    start() { if (!this.started) { this.started = true; this.stopping = false; this.beatCount = 0; this.nextStepTime = this.audioContext.currentTime; this.schedule(); } }
    stop() { this.stopping = true; }
    _internalStop() {
        this.started = false; this.stopping = false;
        const node = editor.getNode(this.reteNodeId);
        if (node) { node.data.running = false; node.controls.running.label = 'Start'; node.stopBlinker(); node.update(); }
    }
    schedule() {
        if (!this.started) return;
        const bpm = this.data.bpm || 120;
        const ppqn = 24;
        const tickDuration = (60.0 / bpm) / ppqn;
        while (this.nextStepTime < this.audioContext.currentTime + 0.1) {
            if (this.stopping && this.beatCount % (ppqn * 4) === 0) { this._internalStop(); return; }
            this.tickListeners.forEach(l => l(this.nextStepTime, tickDuration));
            this.nextStepTime += tickDuration;
            this.beatCount++;
        }
        setTimeout(() => this.schedule(), 25);
    }
    updateParameter(p, v) { this.data[p] = v; }
}

class LFOGenerator {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.oscillator = this.audioContext.createOscillator();
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = this.data.amount || 500;
        this.oscillator.connect(this.mainOutput);
        this.updateParameter('frequency', this.data.frequency || 5);
        this.updateParameter('waveform', this.data.waveform || 'sine');
    }
    start() { if (!this.started) { this.oscillator.start(0); this.started = true; } }
    stop() { if (this.started) { this.oscillator.stop(0); this.started = false; } }
    updateParameter(p, v) {
        this.data[p] = v;
        if (p === 'frequency') this.oscillator.frequency.value = v;
        if (p === 'waveform') this.oscillator.type = v;
        if (p === 'amount') this.mainOutput.gain.value = v;
    }
}

class ADSREnvelope {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.gateOpen = false;
        this.isLooping = false;
        this.internalSource = this.audioContext.createConstantSource();
        this.internalSource.offset.value = 1.0;
        this.mainOutput = this.audioContext.createGain();
        this.mainOutput.gain.value = 0;
        this.internalSource.connect(this.mainOutput);
        this.internalSource.start();
    }
    handleGate(high) {
        if (this.data.mode === 'LFO') return;
        if (high && !this.gateOpen) {
            this.gateOpen = true;
            if (this.data.mode === 'EG') this.trigger();
            else this.startLooping();
        } else if (!high && this.gateOpen) {
            this.gateOpen = false;
            if (this.data.mode === 'EG') this.release();
            else this.stopLooping();
        }
    }
    trigger() {
        const now = this.audioContext.currentTime;
        const gain = this.mainOutput.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(1.0, now + Math.max(0.001, this.data.attack));
        gain.linearRampToValueAtTime(this.data.sustain, now + Math.max(0.001, this.data.attack) + Math.max(0.001, this.data.decay));
    }
    release() {
        const now = this.audioContext.currentTime;
        const gain = this.mainOutput.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(0, now + Math.max(0.001, this.data.release));
    }
    startLooping() { if (!this.isLooping) { this.isLooping = true; this.nextCycleTime = this.audioContext.currentTime; this.scheduleLoop(); } }
    stopLooping() { this.isLooping = false; this.release(); }
    scheduleLoop() {
        if (!this.isLooping) return;
        const gain = this.mainOutput.gain;
        const cycle = this.data.attack + this.data.decay + this.data.release;
        while (this.nextCycleTime < this.audioContext.currentTime + 0.1) {
            gain.setValueAtTime(0, this.nextCycleTime);
            gain.linearRampToValueAtTime(1.0, this.nextCycleTime + this.data.attack);
            gain.linearRampToValueAtTime(this.data.sustain, this.nextCycleTime + this.data.attack + this.data.decay);
            gain.linearRampToValueAtTime(0, this.nextCycleTime + cycle);
            this.nextCycleTime += cycle;
        }
        setTimeout(() => this.scheduleLoop(), 25);
    }
    stop() { if (this.isLooping) this.stopLooping(); else this.release(); }
    updateParameter(p, v) { this.data[p] = v; if (p === 'mode') { this.stopLooping(); this.gateOpen = false; if (v === 'LFO') this.startLooping(); } }
}

class Vocoder {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.started = false;
        this.workletNode = new AudioWorkletNode(this.audioContext, 'vocoder-processor', { numberOfInputs: 2, numberOfOutputs: 1, outputChannelCount: [1] });
        this.carrierInput = this.audioContext.createGain();
        this.modulatorInput = this.audioContext.createGain();
        this.carrierInput.connect(this.workletNode, 0, 0);
        this.modulatorInput.connect(this.workletNode, 0, 1);
        this.internalCarrier = this.audioContext.createOscillator();
        this.internalCarrier.connect(this.carrierInput);
        this.mainOutput = this.audioContext.createGain();
        this.workletNode.connect(this.mainOutput);
        this.updateParameter('frequency', this.data.frequency || 110);
        this.updateParameter('waveform', this.data.waveform || 'sawtooth');
    }
    start() { if (!this.started) { this.internalCarrier.start(0); this.started = true; } }
    stop() { if (this.started) { this.internalCarrier.stop(0); this.started = false; } }
    updateParameter(p, v) {
        this.data[p] = v;
        if (p === 'frequency') this.internalCarrier.frequency.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
        if (p === 'waveform') this.internalCarrier.type = v;
        if (p === 'modulatorGain') this.modulatorInput.gain.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
    }
}

class GranularSynthesizer {
    constructor(audioContext, reteNodeId, data) {
        this.audioContext = audioContext;
        this.reteNodeId = reteNodeId;
        this.data = data;
        this.workletNode = new AudioWorkletNode(this.audioContext, 'granular-processor');
        this.mainInput = this.audioContext.createGain();
        this.mainInput.connect(this.workletNode);
        this.mainOutput = this.workletNode;
        this.updateParameter('grainSize', this.data.grainSize || 0.1);
        this.updateParameter('grainDensity', this.data.grainDensity || 20);
        this.updateParameter('pitchShift', this.data.pitchShift || 0);
        this.updateParameter('positionJitter', this.data.positionJitter || 0);
    }
    updateParameter(p, v) {
        this.data[p] = v;
        const param = this.workletNode.parameters.get(p);
        if (param) param.setTargetAtTime(v, this.audioContext.currentTime, 0.01);
    }
    start() {}
    stop() {}
}

class Multiplayer {
    constructor() {
        this.peer = null;
        this.connections = new Map();
        this.isHost = false;
        this.eventListeners = new Map();
    }
    initialize() {
        this.peer = new Peer();
        this.peer.on('open', id => this.emit('peer-id-ready', id));
        this.peer.on('connection', conn => this._setupConnection(conn));
    }
    startHosting() { this.isHost = true; }
    connectTo(hostId) {
        const conn = this.peer.connect(hostId, { reliable: true });
        this._setupConnection(conn);
    }
    disconnect() { this.connections.forEach(c => c.close()); this.connections.clear(); this.isHost = false; }
    broadcast(data) {
        const payload = JSON.stringify(data);
        this.connections.forEach(c => c.send(payload));
    }
    _setupConnection(conn) {
        conn.on('open', () => {
            this.connections.set(conn.peer, conn);
            if (this.isHost) conn.send(JSON.stringify(window.editorToJSON()));
            this.emit('connections-updated', Array.from(this.connections.values()));
        });
        conn.on('data', data => this.emit('data-received', JSON.parse(data)));
        conn.on('close', () => {
            this.connections.delete(conn.peer);
            this.emit('connections-updated', Array.from(this.connections.values()));
        });
    }
    on(e, cb) { if (!this.eventListeners.has(e)) this.eventListeners.set(e, []); this.eventListeners.get(e).push(cb); }
    emit(e, ...args) { if (this.eventListeners.has(e)) this.eventListeners.get(e).forEach(l => l(...args)); }
    getPeerId() { return this.peer ? this.peer.id : null; }
    isConnected() { return this.connections.size > 0 || this.isHost; }
}

class ConnectionStrategy {
    connect(sourceNode, targetNode, targetInputKey) { throw new Error("Connect method must be implemented"); }
    disconnect(sourceNode, targetNode, targetInputKey) { throw new Error("Disconnect method must be implemented"); }
}

class MidiConnectionStrategy extends ConnectionStrategy {
    connect(sourceReteNode, targetReteNode) {
        const sourceAudioNode = audioNodes.get(sourceReteNode.id);
        const targetAudioNode = audioNodes.get(targetReteNode.id);
        if (targetAudioNode && typeof targetAudioNode.receiveMidiNotes === 'function') {
            if (sourceAudioNode && typeof sourceAudioNode.addMidiListener === 'function') {
                const listener = targetAudioNode.receiveMidiNotes.bind(targetAudioNode);
                if (!targetAudioNode._midiListeners) targetAudioNode._midiListeners = new Map();
                targetAudioNode._midiListeners.set(sourceReteNode.id, listener);
                sourceAudioNode.addMidiListener(listener);
            }
        }
    }
    disconnect(sourceReteNode, targetReteNode) {
        const sourceAudioNode = audioNodes.get(sourceReteNode.id);
        const targetAudioNode = audioNodes.get(targetReteNode.id);
        if (sourceAudioNode && typeof sourceAudioNode.removeMidiListener === 'function') {
            if (targetAudioNode._midiListeners && targetAudioNode._midiListeners.has(sourceReteNode.id)) {
                const listener = targetAudioNode._midiListeners.get(sourceReteNode.id);
                sourceAudioNode.removeMidiListener(listener);
                targetAudioNode._midiListeners.delete(sourceReteNode.id);
            }
        }
    }
}

class VoltageConnectionStrategy extends ConnectionStrategy {
    constructor() {
        super();
        this.analysers = new Map();
        this.gateThreshold = 0.1;
        this.clockThreshold = 0.1;
    }
    connect(sourceReteNode, targetReteNode, targetInputKey) {
        const sourceAudioNode = audioNodes.get(sourceReteNode.id);
        const targetAudioNode = audioNodes.get(targetReteNode.id);
        if (!sourceAudioNode || !targetAudioNode) return;
        const sourceToConnect = sourceAudioNode.mainOutput || sourceAudioNode;
        const namedInput = targetAudioNode[targetInputKey + 'Input'];
        if (namedInput) { sourceToConnect.connect(namedInput); return; }
        if (targetInputKey === 'clock' && typeof targetAudioNode.onTick === 'function') {
            if (sourceAudioNode && typeof sourceAudioNode.addTickListener === 'function') {
                const listener = targetAudioNode.onTick.bind(targetAudioNode);
                if (!targetAudioNode._tickListeners) targetAudioNode._tickListeners = new Map();
                targetAudioNode._tickListeners.set(sourceReteNode.id, listener);
                sourceAudioNode.addTickListener(listener);
            } else { this.startPolling(sourceReteNode, targetReteNode, targetInputKey, 'clock'); }
        } else if (targetInputKey === 'gate' && typeof targetAudioNode.handleGate === 'function') {
            if (sourceAudioNode && typeof sourceAudioNode.addGateListener === 'function') {
                const listener = targetAudioNode.handleGate.bind(targetAudioNode);
                if (!targetAudioNode._gateListeners) targetAudioNode._gateListeners = new Map();
                targetAudioNode._gateListeners.set(sourceReteNode.id, listener);
                sourceAudioNode.addGateListener(listener);
            } else { this.startPolling(sourceReteNode, targetReteNode, targetInputKey, 'gate'); }
        } else {
            const audioParam = this.getAudioParam(targetAudioNode, targetInputKey);
            if (audioParam) sourceToConnect.connect(audioParam);
            else sourceToConnect.connect(targetAudioNode.mainInput || targetAudioNode);
        }
    }
    disconnect(sourceReteNode, targetReteNode, targetInputKey) {
        const sourceAudioNode = audioNodes.get(sourceReteNode.id);
        const targetAudioNode = audioNodes.get(targetReteNode.id);
        if (!sourceAudioNode || !targetAudioNode) return;
        if (targetInputKey === 'clock' && sourceAudioNode && typeof sourceAudioNode.removeTickListener === 'function') {
            if (targetAudioNode._tickListeners && targetAudioNode._tickListeners.has(sourceReteNode.id)) {
                const listener = targetAudioNode._tickListeners.get(sourceReteNode.id);
                sourceAudioNode.removeTickListener(listener);
                targetAudioNode._tickListeners.delete(sourceReteNode.id);
                return;
            }
        }
        if (targetInputKey === 'gate' && sourceAudioNode && typeof sourceAudioNode.removeGateListener === 'function') {
            if (targetAudioNode._gateListeners && targetAudioNode._gateListeners.has(sourceReteNode.id)) {
                const listener = targetAudioNode._gateListeners.get(sourceReteNode.id);
                sourceAudioNode.removeGateListener(listener);
                targetAudioNode._gateListeners.delete(sourceReteNode.id);
                return;
            }
        }
        const sourceToDisconnect = sourceAudioNode.mainOutput || sourceAudioNode;
        const namedInput = targetAudioNode[targetInputKey + 'Input'];
        if (namedInput) { sourceToDisconnect.disconnect(namedInput); return; }
        const key = `${sourceReteNode.id}-${targetReteNode.id}-${targetInputKey}`;
        if (this.analysers.has(key)) {
            const { analyser, sourceNode: storedSource } = this.analysers.get(key);
            try { storedSource.disconnect(analyser); } catch (e) {}
            this.analysers.delete(key);
        } else {
            const audioParam = this.getAudioParam(targetAudioNode, targetInputKey);
            try { sourceToDisconnect.disconnect(audioParam || targetAudioNode.mainInput || targetAudioNode); } catch (e) {}
        }
    }
    startPolling(sourceReteNode, targetReteNode, targetInputKey, type) {
        const sourceAudioNode = audioNodes.get(sourceReteNode.id);
        const targetAudioNode = audioNodes.get(targetReteNode.id);
        const sourceToConnect = sourceAudioNode.mainOutput || sourceAudioNode;
        const analyser = window.audioContext.createAnalyser();
        analyser.fftSize = 32;
        const buffer = new Float32Array(1);
        let lastValue = 0;
        let lastTickTime = window.audioContext.currentTime;
        const key = `${sourceReteNode.id}-${targetReteNode.id}-${targetInputKey}`;
        sourceToConnect.connect(analyser);
        const checkSignal = () => {
            if (!this.analysers.has(key)) return;
            analyser.getFloatTimeDomainData(buffer);
            const currentValue = buffer[0];
            const threshold = type === 'clock' ? this.clockThreshold : this.gateThreshold;
            if (currentValue >= threshold && lastValue < threshold) {
                const now = window.audioContext.currentTime;
                if (type === 'clock') { targetAudioNode.onTick(now, now - lastTickTime); lastTickTime = now; }
                else { targetAudioNode.handleGate(true); }
            } else if (currentValue < threshold && lastValue >= threshold) {
                if (type === 'gate') targetAudioNode.handleGate(false);
            }
            lastValue = currentValue;
            requestAnimationFrame(checkSignal);
        };
        this.analysers.set(key, { analyser, sourceNode: sourceToConnect });
        requestAnimationFrame(checkSignal);
    }
    getAudioParam(targetNode, targetInputKey) {
        switch (targetInputKey) {
            case 'freq': return targetNode.frequency;
            case 'q_cv': return targetNode.Q;
            case 'delay_cv': return targetNode.delayTime;
            case 'gain_cv': return targetNode.gain;
            case 'transpose_cv': return targetNode.transposeControl;
            case 'bands_cv': return targetNode.numBands;
            case 'formant_cv': return targetNode.formantShift;
            case 'unvoiced_cv': return targetNode.unvoicedLevel;
            case 'grainSizeCV': return targetNode.grainSize;
            case 'grainDensityCV': return targetNode.grainDensity;
            case 'pitchShiftCV': return targetNode.pitchShift;
            case 'positionJitterCV': return targetNode.positionJitter;
            default: return null;
        }
    }
}

async function updateAudioGraphConnections() {
    if (!window.audioContext || !window.editor) return;
    const connectionStrategies = {
        'voltage': new VoltageConnectionStrategy(),
        'midi': new MidiConnectionStrategy(),
        'default': new VoltageConnectionStrategy()
    };
    function getConnectionStrategy(targetInputKey) {
        if (targetInputKey === 'midi') return connectionStrategies['midi'];
        return connectionStrategies['default'];
    }
    audioNodes.forEach(audioNode => {
        try { (audioNode.mainOutput || audioNode).disconnect(window.masterGain); } catch (e) {}
    });
    for (const connection of window.editor.getConnections()) {
        const strategy = getConnectionStrategy(connection.targetInput);
        const sourceNode = window.editor.getNode(connection.source);
        const targetNode = window.editor.getNode(connection.target);
        if (sourceNode && targetNode) {
            try { strategy.disconnect(sourceNode, targetNode, connection.targetInput); } catch (e) {}
        }
    }
    for (const connection of window.editor.getConnections()) {
        const strategy = getConnectionStrategy(connection.targetInput);
        const sourceNode = window.editor.getNode(connection.source);
        const targetNode = window.editor.getNode(connection.target);
        if (sourceNode && targetNode) {
            try { strategy.connect(sourceNode, targetNode, connection.targetInput); } catch (e) {}
        }
    }
}

window.Multiplayer = Multiplayer;
window.updateAudioGraphConnections = updateAudioGraphConnections;

const NodeRegistry = {
    _nodes: new Map(),
    register(name, constructor) {
        this._nodes.set(name, constructor);
    },
    getConstructor(name) {
        return this._nodes.get(name);
    },
    getConstructors() {
        const constructors = {};
        for (const [name, constructor] of this._nodes.entries()) {
            constructors[name] = constructor;
        }
        return constructors;
    }
};

const CHORD_TYPES = {
  'Major Triad': [0, 4, 7],
  'Minor Triad': [0, 3, 7],
  'Major 7th': [0, 4, 7, 11],
  'Minor 7th': [0, 3, 7, 10],
  'Diminished Triad': [0, 3, 6],
  'Augmented Triad': [0, 4, 8],
  'Major-Minor 7th (Dominant 7th)': [0, 4, 7, 10],
  'Half Diminished 7th (m7b5)': [0, 3, 6, 10],
  'Diminished 7th': [0, 3, 6, 9],
  'Major 9th': [0, 4, 7, 11, 14],
  'Minor 9th': [0, 3, 7, 10, 14],
  'Dominant 9th': [0, 4, 7, 10, 14],
  'Suspended 2nd (Sus2)': [0, 2, 7],
  'Suspended 4th (Sus4)': [0, 5, 7],
  'Major 6th': [0, 4, 7, 9],
  'Minor 6th': [0, 3, 7, 9],
  'Add9': [0, 4, 7, 14],
  'Minor 11th': [0, 3, 7, 10, 14, 17],
  'Major 7#11': [0, 4, 7, 11, 18],
  'Dominant 7b9': [0, 4, 7, 10, 13]
};

const SCALE_TYPES = {
    'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
    'Natural Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
    'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
    'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
    'Dorian Mode': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian Mode': [0, 1, 3, 5, 7, 8, 10],
    'Lydian Mode': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian Mode': [0, 2, 4, 5, 7, 9, 10],
    'Locrian Mode': [0, 1, 3, 5, 6, 8, 10],
    'Pentatonic Major': [0, 2, 4, 7, 9],
    'Pentatonic Minor': [0, 3, 5, 7, 10],
    'Blues Scale': [0, 3, 5, 6, 7, 10],
    'Whole Tone': [0, 2, 4, 6, 8, 10],
    'Diminished (Whole-Half)': [0, 2, 3, 5, 6, 8, 9, 11],
    'Diminished (Half-Whole)': [0, 1, 3, 4, 6, 7, 9, 10],
    'Chromatic Scale': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

const ROOT_NOTES = {
    'C1': 24, 'C#1': 25, 'D1': 26, 'D#1': 27, 'E1': 28, 'F1': 29, 'F#1': 30, 'G1': 31, 'G#1': 32, 'A1': 33, 'A#1': 34, 'B1': 35,
    'C2': 36, 'C#2': 37, 'D2': 38, 'D#2': 39, 'E2': 40, 'F2': 41, 'F#2': 42, 'G2': 43, 'G#2': 44, 'A2': 45, 'A#2': 46, 'B2': 47,
    'C3': 48, 'C#3': 49, 'D3': 50, 'D#3': 51, 'E3': 52, 'F3': 53, 'F#3': 54, 'G3': 55, 'G#3': 56, 'A3': 57, 'A#3': 58, 'B3': 59,
    'C4': 60, 'C#4': 61, 'D4': 62, 'D#4': 63, 'E4': 64, 'F4': 65, 'F#4': 66, 'G4': 67, 'G#4': 68, 'A4': 69, 'A#4': 70, 'B4': 71,
    'C5': 72, 'C#5': 73, 'D5': 74, 'D#5': 75, 'E5': 76, 'F5': 77, 'F#5': 78, 'G5': 79, 'G#5': 80, 'A5': 81, 'A#5': 82, 'B5': 83,
    'C6': 84, 'C#6': 85, 'D6': 86, 'D#6': 87, 'E6': 88, 'F6': 89, 'F#6': 90, 'G6': 91, 'G#6': 92, 'A6': 93, 'A#6': 94, 'B6': 95
};

const RandomWorkspaceGenerator = {
    getRandomElement(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    },
    generateRandomMelody(scaleName, rootNote, octaveRange, length = 16) {
        const scaleOffsets = SCALE_TYPES[scaleName] || SCALE_TYPES['Major (Ionian)'];
        const rootMidi = ROOT_NOTES[rootNote] || 60;
        const midiToNoteName = {};
        for (const [name, midi] of Object.entries(ROOT_NOTES)) {
            midiToNoteName[midi] = name;
        }

        let possibleNotes = [];
        for (let oct = -octaveRange; oct <= octaveRange; oct++) {
            scaleOffsets.forEach(offset => {
                const midi = rootMidi + offset + (oct * 12);
                if (midiToNoteName[midi]) possibleNotes.push(midiToNoteName[midi]);
            });
        }
        if (possibleNotes.length === 0) possibleNotes = ['C4'];

        let sequence = [];
        for (let i = 0; i < length; i++) {
            if (Math.random() < 0.2) sequence.push('~');
            else sequence.push(this.getRandomElement(possibleNotes));
        }
        return sequence.join(' ');
    },

    templates: {
        ambient: () => {
            const rootNote = RandomWorkspaceGenerator.getRandomElement(['C2', 'G2', 'D2', 'A2', 'E2']);
            const scale = RandomWorkspaceGenerator.getRandomElement(['Major (Ionian)', 'Natural Minor (Aeolian)', 'Dorian Mode', 'Lydian Mode']);
            const sequence = RandomWorkspaceGenerator.generateRandomMelody(scale, rootNote, 2, 16);
            return {
                nodes: [
                    { id: '1', label: 'Master Clock', data: { bpm: RandomWorkspaceGenerator.getRandomInt(60, 90) }, position: { x: 50, y: 300 } },
                    { id: '2', label: 'Sequencer', data: { sequence, waveform: 'sine', noteDuration: '1/4' }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'LFO', data: { frequency: RandomWorkspaceGenerator.getRandomFloat(0.1, 0.5), amount: 1000, waveform: 'sine' }, position: { x: 50, y: 500 } },
                    { id: '4', label: 'Filter', data: { frequency: 1000, q: 1 }, position: { x: 550, y: 100 } },
                    { id: '5', label: 'Reverb', data: { mix: 0.7, duration: 4, decay: 4 }, position: { x: 800, y: 100 } },
                    { id: '6', label: 'Master', data: { gain: 0.4 }, position: { x: 1050, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'clock', target: '2', targetInput: 'clock' },
                    { id: 'c2', source: '2', sourceOutput: 'audio', target: '4', targetInput: 'audio' },
                    { id: 'c3', source: '3', sourceOutput: 'cv', target: '4', targetInput: 'freq' },
                    { id: 'c4', source: '4', sourceOutput: 'audio', target: '5', targetInput: 'audio' },
                    { id: 'c5', source: '5', sourceOutput: 'audio', target: '6', targetInput: 'audio' }
                ]
            };
        },
        acid: () => {
            const sequence = RandomWorkspaceGenerator.generateRandomMelody('Pentatonic Minor', 'C2', 1, 16);
            return {
                nodes: [
                    { id: '1', label: 'Master Clock', data: { bpm: RandomWorkspaceGenerator.getRandomInt(120, 140) }, position: { x: 50, y: 300 } },
                    { id: '2', label: 'Sequencer', data: { sequence, waveform: 'sawtooth', noteDuration: '1/16' }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'Filter', data: { frequency: 400, q: 15, filterType: 'lowpass' }, position: { x: 550, y: 100 } },
                    { id: '4', label: 'ADSR Envelope', data: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1, mode: 'EG' }, position: { x: 300, y: 400 } },
                    { id: '5', label: 'Distortion', data: { drive: 70, amount: 50 }, position: { x: 800, y: 100 } },
                    { id: '6', label: 'Master', data: { gain: 0.3 }, position: { x: 1050, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'clock', target: '2', targetInput: 'clock' },
                    { id: 'c2', source: '2', sourceOutput: 'audio', target: '3', targetInput: 'audio' },
                    { id: 'c3', source: '4', sourceOutput: 'cv', target: '3', targetInput: 'freq' },
                    { id: 'c4', source: '3', sourceOutput: 'audio', target: '5', targetInput: 'audio' },
                    { id: 'c5', source: '5', sourceOutput: 'audio', target: '6', targetInput: 'audio' }
                ]
            };
        },
        techno: () => {
            return {
                nodes: [
                    { id: '1', label: 'Master Clock', data: { bpm: RandomWorkspaceGenerator.getRandomInt(125, 135) }, position: { x: 50, y: 300 } },
                    { id: '2', label: 'Drum Machine', data: { sequence: 'k ~ h ~ k ~ h s', bpm: 130 }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'Sequencer', data: { sequence: 'C1 ~ C1 ~ C2 ~ C1 G1', waveform: 'square', noteDuration: '1/16' }, position: { x: 300, y: 400 } },
                    { id: '4', label: 'Filter', data: { frequency: 500, q: 5 }, position: { x: 550, y: 400 } },
                    { id: '5', label: 'Master', data: { gain: 0.5 }, position: { x: 850, y: 250 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'clock', target: '2', targetInput: 'clock' },
                    { id: 'c2', source: '1', sourceOutput: 'clock', target: '3', targetInput: 'clock' },
                    { id: 'c3', source: '2', sourceOutput: 'audio', target: '5', targetInput: 'audio' },
                    { id: 'c4', source: '3', sourceOutput: 'audio', target: '4', targetInput: 'audio' },
                    { id: 'c5', source: '4', sourceOutput: 'audio', target: '5', targetInput: 'audio' }
                ]
            };
        },
        anime: () => {
            const rootNote = RandomWorkspaceGenerator.getRandomElement(['G3', 'C4', 'F3', 'D4']);
            const scale = RandomWorkspaceGenerator.getRandomElement(['Major (Ionian)', 'Lydian Mode', 'Pentatonic Major']);
            const sequence = RandomWorkspaceGenerator.generateRandomMelody(scale, rootNote, 1, 16);
            return {
                nodes: [
                    { id: '1', label: 'Master Clock', data: { bpm: RandomWorkspaceGenerator.getRandomInt(140, 160) }, position: { x: 50, y: 300 } },
                    { id: '2', label: 'Sequencer', data: { sequence, waveform: 'sine', noteDuration: '1/8' }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'Delay', data: { delayTime: 0.3, feedback: 0.4 }, position: { x: 550, y: 100 } },
                    { id: '4', label: 'Reverb', data: { mix: 0.4 }, position: { x: 800, y: 100 } },
                    { id: '5', label: 'Master', data: { gain: 0.4 }, position: { x: 1050, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'clock', target: '2', targetInput: 'clock' },
                    { id: 'c2', source: '2', sourceOutput: 'audio', target: '3', targetInput: 'audio' },
                    { id: 'c3', source: '3', sourceOutput: 'audio', target: '4', targetInput: 'audio' },
                    { id: 'c4', source: '4', sourceOutput: 'audio', target: '5', targetInput: 'audio' }
                ]
            };
        },
        drumAndBass: () => {
            return {
                nodes: [
                    { id: '1', label: 'Master Clock', data: { bpm: RandomWorkspaceGenerator.getRandomInt(170, 175) }, position: { x: 50, y: 300 } },
                    { id: '2', label: 'Drum Machine', data: { sequence: 'k ~ ~ h s ~ k h', noteDuration: '1/16' }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'Sequencer', data: { sequence: 'C1 ~ ~ ~ ~ ~ ~ ~', waveform: 'sine', noteDuration: '1/4' }, position: { x: 300, y: 400 } },
                    { id: '4', label: 'Distortion', data: { drive: 30, amount: 20 }, position: { x: 550, y: 400 } },
                    { id: '5', label: 'Master', data: { gain: 0.6 }, position: { x: 850, y: 250 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'clock', target: '2', targetInput: 'clock' },
                    { id: 'c2', source: '1', sourceOutput: 'clock', target: '3', targetInput: 'clock' },
                    { id: 'c3', source: '2', sourceOutput: 'audio', target: '5', targetInput: 'audio' },
                    { id: 'c4', source: '3', sourceOutput: 'audio', target: '4', targetInput: 'audio' },
                    { id: 'c5', source: '4', sourceOutput: 'audio', target: '5', targetInput: 'audio' }
                ]
            };
        },
        chiptune: () => {
            return {
                nodes: [
                    { id: '1', label: 'Master Clock', data: { bpm: RandomWorkspaceGenerator.getRandomInt(120, 150) }, position: { x: 50, y: 300 } },
                    { id: '2', label: 'Arpeggiator', data: { chordType: 'Major Triad', rootNote: 'C4', arpeggioPattern: 'Random', octaveRange: 2, noteDuration: '1/16', waveform: 'square' }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'Bitcrusher', data: { bits: 4, sampleRateReduction: 4 }, position: { x: 550, y: 100 } },
                    { id: '4', label: 'Master', data: { gain: 0.3 }, position: { x: 800, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'clock', target: '2', targetInput: 'clock' },
                    { id: 'c2', source: '2', sourceOutput: 'audio', target: '3', targetInput: 'audio' },
                    { id: 'c3', source: '3', sourceOutput: 'audio', target: '4', targetInput: 'audio' }
                ]
            };
        },
        evolvingDrone: () => {
            return {
                nodes: [
                    { id: '1', label: 'Noise Generator', data: { gainValue: 0.5 }, position: { x: 50, y: 100 } },
                    { id: '2', label: 'Filter', data: { frequency: 400, q: 8, filterType: 'bandpass' }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'LFO', data: { frequency: 0.05, amount: 200, waveform: 'sine' }, position: { x: 50, y: 300 } },
                    { id: '4', label: 'Reverb', data: { mix: 0.6, duration: 5 }, position: { x: 550, y: 100 } },
                    { id: '5', label: 'Master', data: { gain: 0.4 }, position: { x: 800, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'audio', target: '2', targetInput: 'audio' },
                    { id: 'c2', source: '3', sourceOutput: 'cv', target: '2', targetInput: 'freq' },
                    { id: 'c3', source: '2', sourceOutput: 'audio', target: '4', targetInput: 'audio' },
                    { id: 'c4', source: '4', sourceOutput: 'audio', target: '5', targetInput: 'audio' }
                ]
            };
        },
        granularClouds: () => {
            return {
                nodes: [
                    { id: '1', label: 'Tone Generator', data: { waveform: 'sine', frequency: 220 }, position: { x: 50, y: 100 } },
                    { id: '2', label: 'Granular Synthesizer', data: { grainSize: 0.2, grainDensity: 40, pitchShift: 0 }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'LFO', data: { frequency: 0.1, amount: 0.3, waveform: 'triangle' }, position: { x: 50, y: 400 } },
                    { id: '4', label: 'Delay', data: { delayTime: 0.4, feedback: 0.6 }, position: { x: 550, y: 100 } },
                    { id: '5', label: 'Reverb', data: { mix: 0.5, duration: 3 }, position: { x: 800, y: 100 } },
                    { id: '6', label: 'Master', data: { gain: 0.3 }, position: { x: 1050, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'audio', target: '2', targetInput: 'audio' },
                    { id: 'c2', source: '3', sourceOutput: 'cv', target: '2', targetInput: 'grainSizeCV' },
                    { id: 'c3', source: '2', sourceOutput: 'audio', target: '4', targetInput: 'audio' },
                    { id: 'c4', source: '4', sourceOutput: 'audio', target: '5', targetInput: 'audio' },
                    { id: 'c5', source: '5', sourceOutput: 'audio', target: '6', targetInput: 'audio' }
                ]
            };
        },
        deepSpace: () => {
            return {
                nodes: [
                    { id: '1', label: 'Chord Generator', data: { chordType: 'Minor 9th', rootNote: 'C2', waveform: 'sawtooth' }, position: { x: 50, y: 100 } },
                    { id: '2', label: 'VCA', data: { gain: 1 }, position: { x: 300, y: 100 } },
                    { id: '3', label: 'Filter', data: { frequency: 300, q: 4, filterType: 'lowpass' }, position: { x: 550, y: 100 } },
                    { id: '4', label: 'LFO', data: { frequency: 0.03, amount: 0.5, waveform: 'sine' }, position: { x: 50, y: 400 } },
                    { id: '5', label: 'LFO', data: { frequency: 0.07, amount: 500, waveform: 'sine' }, position: { x: 300, y: 400 } },
                    { id: '6', label: 'Reverb', data: { mix: 0.8, duration: 8 }, position: { x: 800, y: 100 } },
                    { id: '7', label: 'Master', data: { gain: 0.3 }, position: { x: 1050, y: 100 } }
                ],
                connections: [
                    { id: 'c1', source: '1', sourceOutput: 'audio', target: '2', targetInput: 'audio' },
                    { id: 'c2', source: '4', sourceOutput: 'cv', target: '2', targetInput: 'gain_cv' },
                    { id: 'c3', source: '2', sourceOutput: 'audio', target: '3', targetInput: 'audio' },
                    { id: 'c4', source: '5', sourceOutput: 'cv', target: '3', targetInput: 'freq' },
                    { id: 'c5', source: '3', sourceOutput: 'audio', target: '6', targetInput: 'audio' },
                    { id: 'c6', source: '6', sourceOutput: 'audio', target: '7', targetInput: 'audio' }
                ]
            };
        }
    },

    generate() {
        const templateNames = Object.keys(this.templates);
        const templateName = this.getRandomElement(templateNames);
        const workspace = this.templates[templateName]();
        workspace.workspaceFormatVersion = "2.0";
        return workspace;
    }
};

window.NodeRegistry = NodeRegistry;
window.CHORD_TYPES = CHORD_TYPES;
window.SCALE_TYPES = SCALE_TYPES;
window.ROOT_NOTES = ROOT_NOTES;
window.RandomWorkspaceGenerator = RandomWorkspaceGenerator;
window.migrateV1ToV2 = migrateV1ToV2;
