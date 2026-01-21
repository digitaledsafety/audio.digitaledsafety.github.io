class MiniNotationParser {
    constructor(rootNotes) {
        this.rootNotes = rootNotes;
    }

    parse(sequence, cycle = 0) {
        const tokens = this.tokenize(sequence);
        return this.buildStructure(tokens, cycle);
    }

    tokenize(sequence) {
        // Updated regex to include <, >, and .
        const withSpaces = sequence
            .replace(/([\[\]\(\)\{\}<>\.])/g, ' $1 ') // Add spaces around brackets and dots
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

    buildStructure(tokens, cycle = 0, opener = null) {
        const structure = [];
        const segments = [];
        const openers = ['[', '(', '{', '<'];
        const closers = [']', ')', '}', '>'];

        while (tokens.length > 0) {
            const token = tokens.shift();

            if (token === '.') {
                segments.push([...structure]);
                structure.length = 0;
                continue;
            }

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
                structure.push(this.buildStructure(tokens, cycle, token));
            } else if (closers.includes(token[0])) {
                let currentGroup = structure;
                if (segments.length > 0) {
                    segments.push([...structure]);
                    currentGroup = this.processSegments(segments);
                }

                const modifierString = token.substring(1);

                if (opener === '<') {
                    // Alternation logic: pick one based on the cycle
                    const choice = currentGroup[cycle % currentGroup.length];
                    // Apply modifiers to the picked choice if any
                    if (modifierString) {
                        return this.applyModifierToChoice(choice, modifierString);
                    }
                    return choice;
                }

                return this.applyGroupModifiers(currentGroup, modifierString);
            } else {
                // Check for single token repetition note*n
                const repetitionMatch = token.match(/^([^\[\]\(\)\{\}<>.]+)\*(\d+)$/);
                if (repetitionMatch) {
                    const note = repetitionMatch[1];
                    const count = parseInt(repetitionMatch[2], 10);
                    for (let i = 0; i < count; i++) {
                        // Expanding note*n into n separate tokens.
                        // To preserve the original beat duration, each expanded token
                        // should have its speed multiplied by n.
                        structure.push(note + '*' + count);
                    }
                } else {
                    structure.push(token);
                }
            }
        }

        // Top-level completion
        let finalStructure = structure;
        if (segments.length > 0) {
            segments.push([...structure]);
            finalStructure = this.processSegments(segments);
        }

        if (opener === null) {
            return this.flattenAndProcess(finalStructure);
        }
        return finalStructure;
    }

    processSegments(segments) {
        const result = [];
        for (const segment of segments) {
            const n = segment.length;
            if (n === 0) continue;
            for (const item of segment) {
                // Apply speed modifier to each item in the segment so it takes 1/N of the segment's time.
                // A segment itself takes 1 "beat" of the outer sequence.
                const modified = this.applyModifierRecursively(Array.isArray(item) ? item : [item], `*${n}`);
                result.push(modified);
            }
        }
        return result.flat();
    }

    applyModifierToChoice(choice, modifiers) {
        if (Array.isArray(choice)) {
            return this.applyGroupModifiers(choice, modifiers);
        } else {
            // It's a single note string
            return choice + modifiers;
        }
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
        const flatList = [];
        for (const item of structure) {
            if (Array.isArray(item)) {
                // It's a chord/group, process each note inside
                const chord = item.map(noteString => this.parseNoteEvent(noteString));
                flatList.push(chord);
            } else {
                // It's a single note
                flatList.push(this.parseNoteEvent(item));
            }
        }
        return flatList;
    }

    parseNoteEvent(eventString) {
        if (Array.isArray(eventString)) {
            return eventString.map(s => this.parseNoteEvent(s));
        }

        // Updated regex to include case-insensitive note names and drum notation 'k', 's', 'h'
        let noteName = eventString.match(/[A-Ga-g]#?[0-9]|k|s|h/i)?.[0] || (eventString.includes('~') ? '~' : null);
        let speed = 1;
        let duration = 1;
        let elongation = 1;

        // Speed multiplier/divider
        const speedMatches = eventString.match(/[*\/]\d+/g);
        if (speedMatches) {
            for (const match of speedMatches) {
                const operator = match[0];
                const value = parseInt(match.substring(1), 10);
                if (operator === '*') {
                    speed *= value;
                } else if (operator === '/') {
                    speed /= value;
                }
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

// Export for Node.js environment (for testing)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniNotationParser;
}
