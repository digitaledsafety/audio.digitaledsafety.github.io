class MiniNotationParser {
    constructor(rootNotes) {
        this.rootNotes = rootNotes;
    }

    parse(sequence) {
        const tokens = this.tokenize(sequence);
        return this.buildStructure(tokens);
    }

    tokenize(sequence) {
        // Reverting to a simple space-based split and then handling grouping symbols.
        // This is more robust than a single complex regex.
        const withSpaces = sequence
            .replace(/([\[\]\(\)\{\}])/g, ' $1 ') // Add spaces around brackets
            .trim();
        return withSpaces.split(/\s+/).filter(token => token.length > 0);
    }

    generateEuclidean(pulses, steps) {
        const pattern = [];
        for (let i = 0; i < steps; i++) {
            // This generates a well-distributed pattern
            pattern.push(Math.floor(i * pulses / steps) !== Math.floor((i - 1) * pulses / steps) ? 1 : 0);
        }
        return pattern;
    }

    buildStructure(tokens) {
        const structure = [];
        const openers = ['[', '(', '{'];
        const closers = [']', ')', '}'];

        while (tokens.length > 0) {
            const token = tokens.shift();
            const euclideanMatch = token.match(/^([A-Ga-g#?0-9~_@]+)\*(\d+)\/(\d+)$/);
            if (euclideanMatch) {
                const note = euclideanMatch[1];
                const pulses = parseInt(euclideanMatch[2], 10);
                const steps = parseInt(euclideanMatch[3], 10);

                if (steps > 0) {
                    const pattern = this.generateEuclidean(pulses, steps);
                    const speedModifier = `/${steps}`;
                    const generatedTokens = pattern.map(p => (p === 1 ? note : '~') + speedModifier);
                    tokens.unshift(...generatedTokens);
                    continue;
                }
            }

            if (openers.includes(token)) {
                structure.push(this.buildStructure(tokens));
            } else if (closers.includes(token[0])) {
                const modifierString = token.substring(1);
                return this.applyGroupModifiers(structure, modifierString);
            } else {
                structure.push(token);
            }
        }
        return this.flattenAndProcess(structure);
    }

    applyGroupModifiers(group, modifiers) {
        let modifiedGroup = [...group];

        // Polymetric Tuplets (e.g., :3 for triplets)
        const tupletMatch = modifiers.match(/:(\d+)/);
        if (tupletMatch) {
            const tupletValue = parseInt(tupletMatch[1], 10);
            if (tupletValue > 0) {
                const speedModifier = `*` + tupletValue;
                modifiedGroup = this.applyModifierRecursively(modifiedGroup, speedModifier);
            }
        }

        // Repetition (* operator)
        const repetitionMatch = modifiers.match(/\*(\d+)/);
        if (repetitionMatch) {
            const count = parseInt(repetitionMatch[1], 10);
            const originalGroup = [...modifiedGroup];
            if (count > 1) {
                for (let i = 1; i < count; i++) {
                    modifiedGroup.push(...JSON.parse(JSON.stringify(originalGroup)));
                }
            } else if (count === 0) {
                modifiedGroup = [];
            }
        }

        // Reverse
        if (modifiers.includes('<')) {
            modifiedGroup.reverse();
        }

        // Shuffle
        if (modifiers.includes('?')) {
            for (let i = modifiedGroup.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [modifiedGroup[i], modifiedGroup[j]] = [modifiedGroup[j], modifiedGroup[i]];
            }
        }

        // Speed/Subdivision (/ operator)
        const speedMatch = modifiers.match(/\/(\d+)/);
        if (speedMatch) {
            const modifierToApply = `/` + speedMatch[1];
            modifiedGroup = this.applyModifierRecursively(modifiedGroup, modifierToApply);
        }

        return modifiedGroup;
    }

    applyModifierRecursively(group, modifier) {
        return group.map(item => {
            if (typeof item === 'string') {
                return item + modifier;
            } else if (Array.isArray(item)) {
                return this.applyModifierRecursively(item, modifier);
            }
            return item;
        });
    }

    flattenAndProcess(structure) {
        return structure.map(item => this.parseNoteEvent(item));
    }

    parseNoteEvent(eventString) {
        if (Array.isArray(eventString)) {
            return eventString.flatMap(s => this.parseNoteEvent(s));
        }

        // Updated regex to include drum notation 'k', 's', 'h'
        let noteName = eventString.match(/[A-Ga-g]#?[0-9]|k|s|h/i)?.[0] || (eventString.includes('~') ? '~' : null);
        let speed = 1;
        let duration = 1;
        let elongation = 1;

        // Speed multiplier/divider
        const speedMatch = eventString.match(/[*\/]\d+/);
        if (speedMatch) {
            const operator = speedMatch[0][0];
            const value = parseInt(speedMatch[0].substring(1), 10);
            if (operator === '*') {
                speed *= value;
            } else if (operator === '/') {
                speed /= value;
            }
        }

        // Duration weight
        const durationMatch = eventString.match(/@\d+/);
        if (durationMatch) {
            duration = parseInt(durationMatch[0].substring(1), 10);
        }

        // Elongation
        const elongationMatch = eventString.match(/_/);
        if (elongationMatch) {
            elongation = 1.5;
        }
 
        let midi = null;
        if (noteName && noteName !== '~') {
            midi = this.rootNotes[noteName];
            if (midi === undefined && typeof noteName === 'string') {
                // Try uppercase for notes like 'c4' -> 'C4'
                // and lowercase for drum sounds like 'K' -> 'k' (if they are in the note map)
                midi = this.rootNotes[noteName.toUpperCase()] || this.rootNotes[noteName.toLowerCase()] || null;
            }
        }

        return {
            midi: midi,
            speed: speed,
            duration: duration,
            elongation: elongation,
            noteName: noteName
        };
    }
}