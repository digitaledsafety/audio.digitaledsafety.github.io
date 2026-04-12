/**
 * AudioEditor - A lightweight node-based editor for Web Audio.
 * Designed to replace Rete.js in the "Audio" project.
 */

class AudioEditor {
    constructor(container) {
        this.container = container;
        this.nodes = new Map();
        this.connections = new Map();

        // Panning and Zooming state
        this.translateX = 0;
        this.translateY = 0;
        this.zoom = 1;

        // Interaction state
        this.isDraggingNode = null;
        this.isPanning = false;
        this.lastPointerPos = { x: 0, y: 0 };
        this.activeConnection = null;

        this.setupContainer();
        this.setupInteractions();
    }

    setupContainer() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        this.container.style.userSelect = 'none';
        this.container.style.touchAction = 'none';

        // The world div contains all nodes and connections
        this.world = document.createElement('div');
        this.world.className = 'editor-world';
        this.world.style.position = 'absolute';
        this.world.style.transformOrigin = '0 0';
        this.world.style.width = '1px'; // Tiny size, absolute items will overflow
        this.world.style.height = '1px';
        this.container.appendChild(this.world);

        // Connections are drawn on an SVG layer
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.position = 'absolute';
        this.svg.style.top = '-50000px'; // Cover a huge area
        this.svg.style.left = '-50000px';
        this.svg.style.width = '100000px';
        this.svg.style.height = '100000px';
        this.svg.style.pointerEvents = 'none';
        this.svg.style.zIndex = '0';
        this.world.appendChild(this.svg);

        this.updateTransform();
    }

    async translate(nodeId, position) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.position = { ...position };
            node.update();
            this.updateNodeConnections(node);
        }
    }

    update(type, id) {
        if (type === 'node') {
            const node = this.nodes.get(id);
            if (node) node.update();
        }
    }

    setupInteractions() {
        this.container.addEventListener('pointerdown', this.onPointerDown.bind(this));
        window.addEventListener('pointermove', this.onPointerMove.bind(this));
        window.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.container.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    }

    onPointerDown(e) {
        this.lastPointerPos = { x: e.clientX, y: e.clientY };

        // Check if clicked on a socket
        const socketEl = e.target.closest('.socket');
        if (socketEl) {
            const nodeEl = socketEl.closest('.node');
            const nodeId = nodeEl.getAttribute('data-node-id');
            const node = this.nodes.get(nodeId);
            const socketKey = socketEl.getAttribute('data-socket-key');
            const type = socketEl.getAttribute('data-type');
            const port = type === 'input' ? node.inputs[socketKey] : node.outputs[socketKey];

            this.startConnection(port);
            return;
        }

        // Check if clicked on a node
        const nodeEl = e.target.closest('.node');
        if (nodeEl && !e.target.closest('.control')) {
            const nodeId = nodeEl.getAttribute('data-node-id');
            this.isDraggingNode = this.nodes.get(nodeId);

            // Bring to front
            this.world.appendChild(nodeEl);
            return;
        }

        // Otherwise, start panning
        if (e.target === this.container || e.target === this.world) {
            this.isPanning = true;
        }
    }

    onPointerMove(e) {
        const dx = e.clientX - this.lastPointerPos.x;
        const dy = e.clientY - this.lastPointerPos.y;
        this.lastPointerPos = { x: e.clientX, y: e.clientY };

        if (this.isDraggingNode) {
            this.isDraggingNode.position.x += dx / this.zoom;
            this.isDraggingNode.position.y += dy / this.zoom;
            this.isDraggingNode.update();
            this.updateNodeConnections(this.isDraggingNode);
        } else if (this.isPanning) {
            this.translateX += dx;
            this.translateY += dy;
            this.updateTransform();
        } else if (this.activeConnection) {
            this.updateActiveConnection(e);
        }
    }

    onPointerUp(e) {
        if (this.activeConnection) {
            const socketEl = e.target.closest('.socket');
            if (socketEl) {
                const nodeEl = socketEl.closest('.node');
                const nodeId = nodeEl.getAttribute('data-node-id');
                const node = this.nodes.get(nodeId);
                const socketKey = socketEl.getAttribute('data-socket-key');
                const type = socketEl.getAttribute('data-type');
                const targetPort = type === 'input' ? node.inputs[socketKey] : node.outputs[socketKey];

                this.completeConnection(targetPort);
            } else {
                this.cancelConnection();
            }
        }

        if (this.isDraggingNode) {
            this.emit('nodedragged', this.isDraggingNode);
        }

        this.isDraggingNode = null;
        this.isPanning = false;
        this.activeConnection = null;
    }

    onWheel(e) {
        e.preventDefault();
        const delta = -e.deltaY;
        const factor = Math.pow(1.1, delta / 100);

        const mouseX = e.clientX - this.container.offsetLeft;
        const mouseY = e.clientY - this.container.offsetTop;

        const newZoom = Math.min(Math.max(this.zoom * factor, 0.1), 3);

        // Zoom relative to mouse position
        this.translateX = mouseX - (mouseX - this.translateX) * (newZoom / this.zoom);
        this.translateY = mouseY - (mouseY - this.translateY) * (newZoom / this.zoom);

        this.zoom = newZoom;
        this.updateTransform();
    }

    updateNodeConnections(node) {
        for (const conn of this.connections.values()) {
            if (conn.sourceNode === node || conn.targetNode === node) {
                conn.update();
            }
        }
    }

    startConnection(port) {
        const dummyNode = {
            id: 'dummy',
            editor: this,
            world: this.world,
            outputs: { 'out': { el: { getBoundingClientRect: () => ({ left: this.lastPointerPos.x, top: this.lastPointerPos.y, width: 0, height: 0 }) } } }
        };

        this.activeConnection = {
            startPort: port,
            path: document.createElementNS('http://www.w3.org/2000/svg', 'path')
        };
        this.activeConnection.path.setAttribute('stroke', '#4f46e5');
        this.activeConnection.path.setAttribute('stroke-width', '3');
        this.activeConnection.path.setAttribute('fill', 'none');
        this.activeConnection.path.setAttribute('stroke-dasharray', '5,5');
        this.svg.appendChild(this.activeConnection.path);
    }

    updateActiveConnection(e) {
        const portRect = this.activeConnection.startPort.el.getBoundingClientRect();
        const worldRect = this.world.getBoundingClientRect();

        const x1 = (portRect.left + portRect.width / 2 - worldRect.left) / this.zoom;
        const y1 = (portRect.top + portRect.height / 2 - worldRect.top) / this.zoom;
        const x2 = (e.clientX - worldRect.left) / this.zoom;
        const y2 = (e.clientY - worldRect.top) / this.zoom;

        const dx = Math.abs(x1 - x2) * 0.5;
        let d;
        if (this.activeConnection.startPort.type === 'output') {
            d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        } else {
            d = `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`;
        }
        this.activeConnection.path.setAttribute('d', d);
    }

    async completeConnection(targetPort) {
        this.cancelConnection();

        let sourcePort, destPort;
        if (this.activeConnection.startPort.type === 'output' && targetPort.type === 'input') {
            sourcePort = this.activeConnection.startPort;
            destPort = targetPort;
        } else if (this.activeConnection.startPort.type === 'input' && targetPort.type === 'output') {
            sourcePort = targetPort;
            destPort = this.activeConnection.startPort;
        } else {
            // Not a valid connection (e.g. input to input)
            return;
        }

        // Unified Voltage System: All non-MIDI ports are functionally identical.
        // But we still don't want MIDI connected to voltage.
        if (sourcePort.socket.name !== destPort.socket.name) {
             // In current app, if one is MIDI and other is voltage, we might allow it if it's the "unified system"
             // but usually MIDI is separate. Let's check documentation.
             // "All non-MIDI ports are functionally identical."
             if (sourcePort.socket.name === 'midi' || destPort.socket.name === 'midi') {
                 console.warn("Cannot connect MIDI to Voltage");
                 return;
             }
        }

        // Remove existing connections to the same input if not allowed (Rete style usually allows multiple inputs)
        // But the audio logic might expect only one.

        const connection = new Connection(sourcePort.node, sourcePort.key, destPort.node, destPort.key);
        await this.addConnection(connection);
    }

    cancelConnection() {
        if (this.activeConnection && this.activeConnection.path) {
            this.activeConnection.path.remove();
        }
    }

    updateTransform() {
        this.world.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.zoom})`;
    }

    async addNode(node) {
        node.editor = this;
        this.nodes.set(node.id, node);
        const nodeEl = node.render();
        this.world.appendChild(nodeEl);

        // Initial position
        if (node.position) {
            nodeEl.style.left = `${node.position.x}px`;
            nodeEl.style.top = `${node.position.y}px`;
        }

        this.emit('nodecreated', node);
        return node;
    }

    async removeNode(node) {
        // Remove all connections associated with this node
        for (const conn of Array.from(this.connections.values())) {
            if (conn.sourceNode === node || conn.targetNode === node) {
                this.removeConnection(conn);
            }
        }

        this.nodes.delete(node.id);
        if (node.el) node.el.remove();
        this.emit('noderemoved', node);
    }

    async addConnection(connection) {
        this.connections.set(connection.id, connection);
        const path = connection.render();
        this.svg.appendChild(path);
        this.emit('connectioncreated', connection);
        return connection;
    }

    async removeConnection(connection) {
        this.connections.delete(connection.id);
        if (connection.el) connection.el.remove();
        this.emit('connectionremoved', connection);
    }

    getNodes() {
        return Array.from(this.nodes.values());
    }

    getNode(id) {
        return this.nodes.get(id);
    }

    getConnections() {
        return Array.from(this.connections.values());
    }

    async clear() {
        for (const node of this.getNodes()) {
            await this.removeNode(node);
        }
        this.nodes.clear();
        this.connections.clear();
        this.svg.innerHTML = '';
        this.translateX = 0;
        this.translateY = 0;
        this.zoom = 1;
        this.updateTransform();
    }

    zoomAt(nodes) {
        if (!nodes || nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + (node.el ? node.el.offsetWidth : 200));
            maxY = Math.max(maxY, node.position.y + (node.el ? node.el.offsetHeight : 150));
        });

        const width = maxX - minX;
        const height = maxY - minY;
        const containerWidth = this.container.offsetWidth;
        const containerHeight = this.container.offsetHeight;

        const zoom = Math.min(containerWidth / (width + 100), containerHeight / (height + 100), 1);
        this.zoom = zoom;
        this.translateX = (containerWidth - width * zoom) / 2 - minX * zoom;
        this.translateY = (containerHeight - height * zoom) / 2 - minY * zoom;

        this.updateTransform();
    }

    // Simple EventEmitter
    on(event, callback) {
        if (!this._events) this._events = {};
        if (!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
    }

    emit(event, data) {
        if (this._events && this._events[event]) {
            this._events[event].forEach(cb => cb(data));
        }
    }
}

class Node {
    constructor(label) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.label = label;
        this.inputs = {};
        this.outputs = {};
        this.controls = {};
        this.data = {};
        this.position = { x: 0, y: 0 };
        this.el = null;
    }

    addInput(key, port) {
        port.node = this;
        port.key = key;
        port.type = 'input';
        this.inputs[key] = port;
    }

    addOutput(key, port) {
        port.node = this;
        port.key = key;
        port.type = 'output';
        this.outputs[key] = port;
    }

    addControl(key, control) {
        control.node = this;
        control.key = key;
        this.controls[key] = control;
    }

    render() {
        const div = document.createElement('div');
        div.className = 'node';
        div.setAttribute('data-node-id', this.id);
        div.style.position = 'absolute';
        this.el = div;

        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = this.label;
        div.appendChild(title);

        // Inputs
        const inputsContainer = document.createElement('div');
        inputsContainer.className = 'inputs';
        for (const key in this.inputs) {
            inputsContainer.appendChild(this.inputs[key].render());
        }
        div.appendChild(inputsContainer);

        // Controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls';
        for (const key in this.controls) {
            const controlEl = this.controls[key].render();
            if (controlEl) controlsContainer.appendChild(controlEl);
        }
        div.appendChild(controlsContainer);

        // Outputs
        const outputsContainer = document.createElement('div');
        outputsContainer.className = 'outputs';
        for (const key in this.outputs) {
            outputsContainer.appendChild(this.outputs[key].render());
        }
        div.appendChild(outputsContainer);

        return div;
    }

    update() {
        if (!this.el) return;

        // Update controls
        const controlsContainer = this.el.querySelector('.controls');
        if (controlsContainer) {
            controlsContainer.innerHTML = '';
            for (const key in this.controls) {
                const controlEl = this.controls[key].render();
                if (controlEl) controlsContainer.appendChild(controlEl);
            }
        }

        // Update position if needed (usually handled by dragging logic)
        this.el.style.left = `${this.position.x}px`;
        this.el.style.top = `${this.position.y}px`;
    }

    start() {
        // To be implemented by subclasses
    }

    stop() {
        // To be implemented by subclasses
    }
}

class Port {
    constructor(socket, label) {
        this.socket = socket;
        this.label = label;
        this.node = null;
        this.key = null;
        this.type = null; // 'input' or 'output'
        this.el = null;
    }

    render() {
        const div = document.createElement('div');
        div.className = this.type === 'input' ? 'input' : 'output';

        const socket = document.createElement('div');
        socket.className = `socket ${this.type}`;
        socket.setAttribute('data-socket-key', this.key);
        socket.setAttribute('data-type', this.type);
        this.el = socket;

        const title = document.createElement('div');
        title.className = this.type === 'input' ? 'input-title' : 'output-title';
        title.textContent = this.label;

        if (this.type === 'input') {
            div.appendChild(socket);
            div.appendChild(title);
        } else {
            div.appendChild(title);
            div.appendChild(socket);
        }

        return div;
    }
}

class Connection {
    constructor(sourceNode, sourceOutput, targetNode, targetInput) {
        this.id = `c_${sourceNode.id}_${sourceOutput}_${targetNode.id}_${targetInput}`;
        this.source = sourceNode.id;
        this.sourceOutput = sourceOutput;
        this.target = targetNode.id;
        this.targetInput = targetInput;

        this.sourceNode = sourceNode;
        this.targetNode = targetNode;

        this.el = null;
    }

    render() {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', '#666');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        this.el = path;
        this.update();
        return path;
    }

    update() {
        if (!this.el) return;

        const sourcePort = this.sourceNode.outputs[this.sourceOutput];
        const targetPort = this.targetNode.inputs[this.targetInput];

        if (!sourcePort || !targetPort || !sourcePort.el || !targetPort.el) return;

        const sourceRect = sourcePort.el.getBoundingClientRect();
        const targetRect = targetPort.el.getBoundingClientRect();
        const worldRect = this.sourceNode.editor.world.getBoundingClientRect();
        const zoom = this.sourceNode.editor.zoom;

        const x1 = (sourceRect.left + sourceRect.width / 2 - worldRect.left) / zoom;
        const y1 = (sourceRect.top + sourceRect.height / 2 - worldRect.top) / zoom;
        const x2 = (targetRect.left + targetRect.width / 2 - worldRect.left) / zoom;
        const y2 = (targetRect.top + targetRect.height / 2 - worldRect.top) / zoom;

        const dx = Math.abs(x1 - x2) * 0.5;
        const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        this.el.setAttribute('d', path);
    }
}

class Socket {
    constructor(name) {
        this.name = name;
    }
}

// Controls
class Control {
    constructor(id) {
        this.id = id;
        this.node = null;
        this.key = null;
        this.hidden = false;
    }

    render() {
        if (this.hidden) return null;
        const div = document.createElement('div');
        div.className = 'control';
        return div;
    }
}

class SliderControl extends Control {
    constructor(id, label, min, max, step, initialValue, onValueChange, isLog = false) {
        super(id);
        this.label = label;
        this.min = min;
        this.max = max;
        this.step = step;
        this.value = initialValue;
        this.onValueChange = onValueChange;
        this.isLog = isLog;
    }

    render() {
        if (this.hidden) return null;
        const div = super.render();

        const label = document.createElement('label');
        label.textContent = this.label;
        div.appendChild(label);

        const slider = document.createElement('input');
        slider.type = 'range';

        const linearToLog = (value, min, max) => {
            const minLog = Math.log(min);
            const maxLog = Math.log(max);
            const scale = (maxLog - minLog) / 100;
            return Math.exp(minLog + scale * value);
        };

        const logToLinear = (value, min, max) => {
            const minLog = Math.log(min);
            const maxLog = Math.log(max);
            const scale = (maxLog - minLog) / 100;
            return (Math.log(value) - minLog) / scale;
        };

        if (this.isLog) {
            slider.min = 0;
            slider.max = 100;
            slider.step = 0.1;
            slider.value = logToLinear(this.value, this.min, this.max);
        } else {
            slider.min = this.min;
            slider.max = this.max;
            slider.step = this.step;
            slider.value = this.value;
        }

        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'value-display';
        valueDisplay.textContent = Number(this.value).toFixed(2);

        slider.oninput = (e) => {
            const val = parseFloat(e.target.value);
            const finalValue = this.isLog ? linearToLog(val, this.min, this.max) : val;
            this.value = finalValue;
            valueDisplay.textContent = finalValue.toFixed(2);
            if (this.onValueChange) this.onValueChange(finalValue);

            // Global events handled by the application
            if (window.autoSave) window.autoSave();
            if (window.multiplayer) window.multiplayer.broadcast(window.editorToJSON());
        };

        div.appendChild(slider);
        div.appendChild(valueDisplay);
        return div;
    }
}

class SelectControl extends Control {
    constructor(id, label, options, initialValue, onValueChange) {
        super(id);
        this.label = label;
        this.options = options;
        this.value = initialValue;
        this.onValueChange = onValueChange;
    }

    render() {
        if (this.hidden) return null;
        const div = super.render();

        const label = document.createElement('label');
        label.textContent = this.label;
        div.appendChild(label);

        const select = document.createElement('select');
        this.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.textContent = opt;
            if (opt === this.value) option.selected = true;
            select.appendChild(option);
        });

        select.onchange = (e) => {
            const val = e.target.value;
            this.value = val;
            if (this.onValueChange) this.onValueChange(val);
            if (window.autoSave) window.autoSave();
            if (window.multiplayer) window.multiplayer.broadcast(window.editorToJSON());
        };

        div.appendChild(select);
        return div;
    }
}

class ButtonControl extends Control {
    constructor(id, label, onClick) {
        super(id);
        this.label = label;
        this.onClick = onClick;
    }

    render() {
        if (this.hidden) return null;
        const div = super.render();
        const button = document.createElement('button');
        button.className = 'button button-secondary w-full';
        button.textContent = this.label;
        button.onclick = () => {
            if (this.onClick) this.onClick();
            if (window.autoSave) window.autoSave();
            if (window.multiplayer) window.multiplayer.broadcast(window.editorToJSON());
        };
        div.appendChild(button);
        return div;
    }
}

class TextControl extends Control {
    constructor(id, label, initialValue, onValueChange) {
        super(id);
        this.label = label;
        this.value = initialValue;
        this.onValueChange = onValueChange;
    }

    render() {
        if (this.hidden) return null;
        const div = super.render();

        const label = document.createElement('label');
        label.textContent = this.label;
        div.appendChild(label);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.value;
        input.className = 'w-full p-2 border border-gray-300 rounded mt-1 bg-white text-gray-900';

        input.oninput = (e) => {
            const val = e.target.value;
            this.value = val;
            if (this.onValueChange) this.onValueChange(val);
            if (window.autoSave) window.autoSave();
            if (window.multiplayer) window.multiplayer.broadcast(window.editorToJSON());
        };

        div.appendChild(input);
        return div;
    }
}

class IndicatorControl extends Control {
    constructor(id, label) {
        super(id);
        this.label = label;
    }

    render() {
        if (this.hidden) return null;
        const div = super.render();
        const indicator = document.createElement('div');
        indicator.className = 'clock-indicator';
        indicator.title = this.label;
        div.appendChild(indicator);
        return div;
    }
}

class ToggleControl extends Control {
    constructor(id, label, initialValue, onValueChange) {
        super(id);
        this.label = label;
        this.value = initialValue;
        this.onValueChange = onValueChange;
    }

    render() {
        if (this.hidden) return null;
        const div = super.render();

        const label = document.createElement('label');
        label.className = 'flex items-center justify-center cursor-pointer';

        const span = document.createElement('span');
        span.className = 'mr-3 text-white';
        span.textContent = this.label;
        label.appendChild(span);

        const container = document.createElement('div');
        container.className = 'relative';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.className = 'sr-only peer';
        input.checked = this.value;

        const toggleDiv = document.createElement('div');
        toggleDiv.className = "w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600";

        input.onchange = (e) => {
            const val = e.target.checked;
            this.value = val;
            if (this.onValueChange) this.onValueChange(val);
            if (window.autoSave) window.autoSave();
            if (window.multiplayer) window.multiplayer.broadcast(window.editorToJSON());
        };

        container.appendChild(input);
        container.appendChild(toggleDiv);
        label.appendChild(container);
        div.appendChild(label);

        return div;
    }
}

// Exporting to window
window.AudioEditor = AudioEditor;
window.AudioNode = Node;
window.AudioPort = Port;
window.AudioConnection = Connection;
window.AudioSocket = Socket;
window.AudioControl = Control;
window.SliderControl = SliderControl;
window.SelectControl = SelectControl;
window.ButtonControl = ButtonControl;
window.TextControl = TextControl;
window.IndicatorControl = IndicatorControl;
window.ToggleControl = ToggleControl;
