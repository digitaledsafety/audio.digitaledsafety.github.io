class MiniNotationParser {
    constructor(rootNotes) {
        this.rootNotes = rootNotes;
    }

    parse(sequence, cycle = 0) {
        if (!sequence || sequence.trim() === '') return [];
        const tokens = this.tokenize(sequence);
        const tree = this.buildTree(tokens);
        const cycleTree = this.pickForCycle(tree, cycle, {});
        return this.flatten(cycleTree);
    }

    tokenize(sequence) {
        const withSpaces = sequence
            .replace(/([\[\]\(\)\{\}<>,^])/g, ' $1 ')
            .trim();
        return withSpaces.split(/\s+/).filter(token => token.length > 0);
    }

    generateEuclidean(pulses, steps) {
        const pattern = [];
        for (let i = 0; i < steps; i++) {
            pattern.push(Math.floor(i * pulses / steps) !== Math.floor((i - 1) * pulses / steps) ? 1 : 0);
        }
        return pattern;
    }

    buildTree(tokens) {
        const createNode = (type) => ({ type, children: [], hasCaret: false });
        const root = createNode('sequence');
        const stack = [root];

        const openers = { '[': 'sequence', '<': 'alternation', '(': 'euclidean', '{': 'polymetric' };
        const closers = { ']': '[', '>': '<', ')': '(', '}': '{' };

        while (tokens.length > 0) {
            const token = tokens.shift();

            if (token === '^') {
                stack[stack.length - 1].hasCaret = true;
                continue;
            }

            if (openers[token]) {
                const newNode = createNode(openers[token]);
                stack[stack.length - 1].children.push(newNode);
                stack.push(newNode);
            } else if (closers[token]) {
                while (stack.length > 1 && stack[stack.length - 1].type === 'chord') {
                    stack.pop();
                }
                const last = stack.pop();

                if (last.type === 'euclidean') {
                    const params = last.children.map(c => c.value).join('').split(',').map(s => parseInt(s.trim(), 10));
                    const pulses = params[0] || 1;
                    const steps = params[1] || 1;
                    const pattern = this.generateEuclidean(pulses, steps);

                    const parent = stack[stack.length - 1];
                    let baseNote = '~';
                    const eucIndex = parent.children.indexOf(last);
                    if (eucIndex > 0) {
                        const prev = parent.children[eucIndex - 1];
                        if (prev.type === 'leaf') {
                            baseNote = prev.value;
                            parent.children.splice(eucIndex - 1, 1);
                        }
                    }

                    last.type = 'sequence';
                    last.children = pattern.map(p => ({ type: 'leaf', value: p === 1 ? baseNote : '~' }));
                }

                while (tokens.length > 0 && /^[*\/!@?]/.test(tokens[0])) {
                    last.modifier = (last.modifier || '') + tokens.shift();
                }
            } else if (token === ',') {
                const currentParent = stack[stack.length - 1];
                if (currentParent.type === 'euclidean') {
                    currentParent.children.push({ type: 'leaf', value: ',' });
                } else if (currentParent.type === 'chord') {
                    // Stay
                } else if (currentParent.children.length > 0) {
                    const lastChild = currentParent.children.pop();
                    const newChord = createNode('chord');
                    newChord.children.push(lastChild);
                    currentParent.children.push(newChord);
                    stack.push(newChord);
                }
            } else {
                if (stack[stack.length - 1].type === 'euclidean') {
                    stack[stack.length - 1].children.push({ type: 'leaf', value: token });
                    continue;
                }

                const modifierMatch = token.match(/([*\/!@?][\d.]+)+/);
                let value = token;
                let modifier = "";
                if (modifierMatch) {
                    value = token.substring(0, modifierMatch.index);
                    modifier = token.substring(modifierMatch.index);
                }

                const leaf = { type: 'leaf', value: value, modifier: modifier };
                while (tokens.length > 0 && /^[*\/!@?]/.test(tokens[0])) {
                    leaf.modifier += tokens.shift();
                }
                stack[stack.length - 1].children.push(leaf);

                if (stack[stack.length - 1].type === 'chord' && tokens[0] !== ',') {
                    stack.pop();
                }
            }
        }
        return root;
    }

    pickForCycle(node, cycle, state) {
        if (node.type === 'leaf') return { ...node };
        if (node.type === 'alternation') {
            const index = cycle % node.children.length;
            return this.pickForCycle(node.children[index], cycle, state);
        }
        return {
            ...node,
            children: (node.children || []).map(child => this.pickForCycle(child, cycle, state))
        };
    }

    getIntrinsicDuration(node) {
        if (node.type === 'leaf' || node.type === 'chord') return 1;
        if (node.type === 'alternation' || (node.type === 'sequence' && node.hasCaret)) {
            return (node.children || []).reduce((sum, child) => sum + this.getIntrinsicDuration(child), 0);
        }
        return 1;
    }

    flatten(node, speed = 1, duration = 1) {
        let localSpeed = speed;
        let localDuration = duration;
        if (node.modifier) {
            const mods = node.modifier.match(/[*\/@][\d.]+|[!?]/g) || [];
            mods.forEach(mod => {
                if (mod.startsWith('*')) localSpeed *= parseFloat(mod.substring(1));
                else if (mod.startsWith('/')) localSpeed /= parseFloat(mod.substring(1));
                else if (mod.startsWith('@')) localDuration *= parseFloat(mod.substring(1));
            });
        }

        if (node.type === 'leaf') {
            return [this.parseNoteEvent(node.value, localSpeed, localDuration)];
        }

        if (node.type === 'chord') {
            const events = (node.children || []).flatMap(child => this.flatten(child, localSpeed, localDuration));
            return [events];
        }

        if (node.children) {
            const intrinsicDurations = node.children.map(child => this.getIntrinsicDuration(child));
            const maxIntrinsic = Math.max(1, ...intrinsicDurations);
            const finalDurations = node.children.map((child, i) => {
                if (child.type === 'leaf' || child.type === 'chord' || (child.type === 'sequence' && !child.hasCaret)) {
                    return maxIntrinsic;
                }
                return intrinsicDurations[i];
            });
            const totalDurationAtLevel = finalDurations.reduce((a, b) => a + b, 0);

            return node.children.flatMap((child, i) => {
                const childDuration = finalDurations[i];
                const childSpeed = localSpeed * (totalDurationAtLevel / childDuration);
                return this.flatten(child, childSpeed, localDuration);
            });
        }

        return [];
    }

    parseNoteEvent(eventString, speed, duration) {
        let noteName = eventString.match(/[A-Ga-g]#?[0-9]|k|s|h/i)?.[0] || (eventString.includes('~') ? '~' : null);
        let elongation = eventString.includes('_') ? 1.5 : 1;

        let midi = null;
        if (noteName && noteName !== '~') {
            midi = this.rootNotes[noteName];
            if (midi === undefined && typeof noteName === 'string') {
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

if (typeof module !== 'undefined') {
    module.exports = MiniNotationParser;
}