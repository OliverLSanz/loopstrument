"use strict";
// It is not straightforward to use different ts files in a bitwig script
// So for now I'm just using one big file with fancy titles :-)
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LinnStrument_bitwig, _TaskManager_scheduledTasks, _TaskManager_host, _ControllerModule_onUpdate, _ClipArray_instances, _ClipArray_updateClipLight, _LoopLength_bars, _LoopLength_nextBars, _LoopLength_pressedButtons, _Metronome_instances, _Metronome_onTap, _Metronome_onLongPress, _LiveLoopingController_interfaceEnabled, _LiveLoopingController_noteInput, _LiveLoopingController_linn, _LiveLoopingController_modules;
const lightColorValues = {
    default: 0,
    red: 1,
    yellow: 2,
    green: 3,
    cyan: 4,
    blue: 5,
    magenta: 6,
    off: 7,
    white: 8,
    orange: 9,
    lime: 10,
    pink: 11,
};
const rowIndexes = [0, 1, 2, 3, 4, 5, 6, 7];
const columnIndexes = [0, 1, 2, 3, 4];
const NOTE_OFF = 8;
const NOTE_ON = 9;
const CC = 11;
//  ___      ___   _______  ______    _______  ______    __   __
// |   |    |   | |  _    ||    _ |  |   _   ||    _ |  |  | |  |
// |   |    |   | | |_|   ||   | ||  |  |_|  ||   | ||  |  |_|  |
// |   |    |   | |       ||   |_||_ |       ||   |_||_ |       |
// |   |___ |   | |  _   | |    __  ||       ||    __  ||_     _|
// |       ||   | | |_|   ||   |  | ||   _   ||   |  | |  |   |
// |_______||___| |_______||___|  |_||__| |__||___|  |_|  |___|
//  _     _             _
// | |   (_)  _        (_)
// | |__  _ _| |_ _ _ _ _  ____
// |  _ \| (_   _) | | | |/ _  |
// | |_) ) | | |_| | | | ( (_| |
// |____/|_|  \__)\___/|_|\___ |
//                       (_____|
// This class is the gateway to interact with bitwig.
// Everything is accessed from this class' instance.
// The host, transport, tracks and application attributes allow dirty direct
// control of bitwig.
// But the class also presents some nice helper methods to do some things
// more easily.
class Bitwig {
    constructor(host) {
        this.host = host;
        this.transport = host.createTransport();
        this.tracks = host.createMainTrackBank(5, 0, 3);
        this.application = host.createApplication();
    }
    armTrack(trackIndex) {
        const bankSize = this.tracks.getSizeOfBank();
        for (let i = 0; i < bankSize; i++) {
            this.tracks.getItemAt(i).arm().set(trackIndex === i);
        }
        const selectedTrack = this.tracks.getItemAt(trackIndex);
        selectedTrack.selectInEditor();
        selectedTrack.selectInMixer();
        selectedTrack.makeVisibleInArranger();
        selectedTrack.makeVisibleInMixer();
    }
    midiOut({ type, channel, data1, data2 }) {
        const status = type << 4 + channel;
        this.host.getMidiOutPort(0).sendMidi(status, data1, data2);
    }
}
//  _ _                 _                                   _
// | (_)               | |                                 | |
// | |_ _ __  _ __  ___| |_ _ __ _   _ _ __ ___   ___ _ __ | |_
// | | | '_ \| '_ \/ __| __| '__| | | | '_ ` _ \ / _ \ '_ \| __|
// | | | | | | | | \__ \ |_| |  | |_| | | | | | |  __/ | | | |
// |_|_|_| |_|_| |_|___/\__|_|   \__,_|_| |_| |_|\___|_| |_|\__|
// This class contains some helper methods to control the linnstrument more
// easily. All is done through the Bitwig interface.
class LinnStrument {
    constructor(bitwig) {
        _LinnStrument_bitwig.set(this, void 0);
        __classPrivateFieldSet(this, _LinnStrument_bitwig, bitwig, "f");
    }
    setLight({ row, column, color }) {
        // 20 is for select column to change color, 1 is first play column.
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 20, data2: column + 1 });
        // 21 for select row. Top is 7.
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 21, data2: Math.abs(row - 7) });
        // 22 to set color, 1 is red
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 22, data2: lightColorValues[color] });
    }
    resetLights() {
        rowIndexes.forEach(row => {
            columnIndexes.forEach(column => {
                this.setLight({ row, column, color: "default" });
            });
        });
    }
    turnOffLights() {
        rowIndexes.forEach(row => {
            columnIndexes.forEach(column => {
                this.setLight({ row, column, color: "off" });
            });
        });
    }
}
_LinnStrument_bitwig = new WeakMap();
class TaskManager {
    constructor(host) {
        _TaskManager_scheduledTasks.set(this, void 0);
        _TaskManager_host.set(this, void 0);
        __classPrivateFieldSet(this, _TaskManager_scheduledTasks, new Set(), "f");
        __classPrivateFieldSet(this, _TaskManager_host, host, "f");
    }
    scheduleTask(task, millis) {
        const taskUID = new Date().toISOString();
        __classPrivateFieldGet(this, _TaskManager_scheduledTasks, "f").add(taskUID);
        __classPrivateFieldGet(this, _TaskManager_host, "f").scheduleTask(() => {
            if (__classPrivateFieldGet(this, _TaskManager_scheduledTasks, "f").has(taskUID)) {
                task();
                __classPrivateFieldGet(this, _TaskManager_scheduledTasks, "f").delete(taskUID);
            }
        }, millis);
        return taskUID;
    }
    cancelTask(taskId) {
        __classPrivateFieldGet(this, _TaskManager_scheduledTasks, "f").delete(taskId);
    }
}
_TaskManager_scheduledTasks = new WeakMap(), _TaskManager_host = new WeakMap();
//                               __                   __ __
// .-----.----.-----.-----.-----|  |--.---.-.-----.--|  |  .-----.----.
// |  _  |   _|  -__|__ --|__ --|     |  _  |     |  _  |  |  -__|   _|
// |   __|__| |_____|_____|_____|__|__|___._|__|__|_____|__|_____|__|
// |__|
// Allows setting different callbacks for taps and long-presses
class PressHandler {
    constructor(taskManager) {
        this.longPressTasks = {};
        this.taskManager = taskManager;
    }
    handlePressBegin(shortPress, longPress, millis, buttonId) {
        const taskId = this.taskManager.scheduleTask(() => {
            longPress();
            delete this.longPressTasks[buttonId];
        }, millis);
        this.longPressTasks[buttonId] = { taskId, shortPress };
    }
    handlePressEnd(buttonId) {
        if (this.longPressTasks[buttonId] !== undefined) {
            this.longPressTasks[buttonId].shortPress();
            this.taskManager.cancelTask(this.longPressTasks[buttonId].taskId);
            delete this.longPressTasks[buttonId];
        }
    }
}
//  _______  _______  __    _  _______  ______    _______  ___      ___      _______  ______
// |       ||       ||  |  | ||       ||    _ |  |       ||   |    |   |    |       ||    _ |
// |       ||   _   ||   |_| ||_     _||   | ||  |   _   ||   |    |   |    |    ___||   | ||
// |       ||  | |  ||       |  |   |  |   |_||_ |  | |  ||   |    |   |    |   |___ |   |_||_
// |      _||  |_|  ||  _    |  |   |  |    __  ||  |_|  ||   |___ |   |___ |    ___||    __  |
// |     |_ |       || | |   |  |   |  |   |  | ||       ||       ||       ||   |___ |   |  | |
// |_______||_______||_|  |__|  |___|  |___|  |_||_______||_______||_______||_______||___|  |_|
// Avobe this all were helper classes. This is the actual controller code!
class ControllerModule {
    constructor(bitwig, pressHandler, linnstrument, controller) {
        _ControllerModule_onUpdate.set(this, void 0);
        this.bitwig = bitwig;
        this.pressHandler = pressHandler;
        this.linn = linnstrument;
        this.controller = controller;
        __classPrivateFieldSet(this, _ControllerModule_onUpdate, [], "f");
    }
    init() { }
    update() {
        __classPrivateFieldGet(this, _ControllerModule_onUpdate, "f").forEach(callback => callback());
    }
    handleMidi(midi) { return false; }
    addValueObserver(subject, callback) {
        subject.addValueObserver(callback);
        __classPrivateFieldGet(this, _ControllerModule_onUpdate, "f").push(callback);
    }
    addInitCallback(callback) {
        callback();
        __classPrivateFieldGet(this, _ControllerModule_onUpdate, "f").push(callback);
    }
}
_ControllerModule_onUpdate = new WeakMap();
class TracksRow extends ControllerModule {
    init() {
        for (let trackIndex = 0; trackIndex < 5; trackIndex++) {
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            this.addValueObserver(track.arm(), () => {
                const isArmed = track.arm().get();
                this.controller.setLight({ row: 0, column: trackIndex, color: isArmed ? "magenta" : "off" });
            });
        }
    }
    handleMidi(midi) {
        // SWITCH TRACKS
        if (midi.type === NOTE_ON && midi.data1 === 65) {
            this.bitwig.armTrack(0);
        }
        if (midi.type === NOTE_ON && midi.data1 === 66) {
            this.bitwig.armTrack(1);
        }
        if (midi.type === NOTE_ON && midi.data1 === 67) {
            this.bitwig.armTrack(2);
        }
        if (midi.type === NOTE_ON && midi.data1 === 68) {
            this.bitwig.armTrack(3);
        }
        if (midi.type === NOTE_ON && midi.data1 === 69) {
            this.bitwig.armTrack(4);
        }
        return false;
    }
}
class ClipArray extends ControllerModule {
    constructor() {
        super(...arguments);
        _ClipArray_instances.add(this);
    }
    init() {
        // Start observers
        for (let trackIndex = 0; trackIndex < 5; trackIndex++) {
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            for (let clipIndex = 0; clipIndex < 3; clipIndex++) {
                const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
                this.addValueObserver(clip.isPlaying(), () => {
                    __classPrivateFieldGet(this, _ClipArray_instances, "m", _ClipArray_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
                this.addValueObserver(clip.isPlaying(), () => {
                    __classPrivateFieldGet(this, _ClipArray_instances, "m", _ClipArray_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
                this.addValueObserver(clip.isRecording(), () => {
                    __classPrivateFieldGet(this, _ClipArray_instances, "m", _ClipArray_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
                this.addValueObserver(clip.hasContent(), () => {
                    __classPrivateFieldGet(this, _ClipArray_instances, "m", _ClipArray_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
            }
        }
    }
    handleMidi(midi) {
        if (midi.type === NOTE_ON && midi.data1 >= 50 && midi.data1 <= 64) {
            const trackIndex = midi.data1 % 5;
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            const clipIndex = Math.floor(Math.abs(midi.data1 - 64) / 5);
            const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
            function onTap() {
                if (clip.isPlaying().getAsBoolean()) {
                    track.stop();
                }
                else {
                    clip.launch();
                }
            }
            function onLongPress() {
                clip.deleteObject();
            }
            this.pressHandler.handlePressBegin(onTap, onLongPress, 1000, midi.data1);
            return true;
        }
        if (midi.type === NOTE_OFF && midi.data1 >= 50 && midi.data1 <= 64) {
            this.pressHandler.handlePressEnd(midi.data1);
            return true;
        }
        return false;
    }
}
_ClipArray_instances = new WeakSet(), _ClipArray_updateClipLight = function _ClipArray_updateClipLight(trackIndex, track, clipIndex) {
    const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
    if (clip.isRecording().getAsBoolean()) {
        this.controller.setLight({ row: clipIndex + 1, column: trackIndex, color: "red" });
        return;
    }
    if (clip.isPlaying().getAsBoolean()) {
        this.controller.setLight({ row: clipIndex + 1, column: trackIndex, color: "blue" });
        return;
    }
    if (clip.hasContent().getAsBoolean()) {
        this.controller.setLight({ row: clipIndex + 1, column: trackIndex, color: "white" });
        return;
    }
    // Clip is empty
    this.controller.setLight({ row: clipIndex + 1, column: trackIndex, color: "off" });
};
class LoopLength extends ControllerModule {
    constructor() {
        super(...arguments);
        _LoopLength_bars.set(this, 0);
        _LoopLength_nextBars.set(this, 0);
        _LoopLength_pressedButtons.set(this, [false, false, false, false, false]);
    }
    init() {
        this.addValueObserver(this.bitwig.transport.clipLauncherPostRecordingAction(), () => {
            this.updateLights();
        });
        this.addValueObserver(this.bitwig.transport.getClipLauncherPostRecordingTimeOffset(), () => {
            this.updateLights();
        });
        this.addValueObserver(this.bitwig.transport.timeSignature().numerator(), () => {
            this.setLoopLength();
        });
        this.addValueObserver(this.bitwig.transport.timeSignature().denominator(), () => {
            this.setLoopLength();
        });
    }
    setLoopLength() {
        const numberOfBars = __classPrivateFieldGet(this, _LoopLength_bars, "f");
        const numerator = this.bitwig.transport.timeSignature().numerator().get();
        const denominator = this.bitwig.transport.timeSignature().denominator().get();
        this.bitwig.transport.clipLauncherPostRecordingAction().set("play_recorded");
        this.bitwig.transport.getClipLauncherPostRecordingTimeOffset().set(4 * numberOfBars * numerator / denominator);
    }
    updateLights() {
        const postRecordingOffset = this.bitwig.transport.getClipLauncherPostRecordingTimeOffset().get();
        const numerator = this.bitwig.transport.timeSignature().numerator().get();
        const denominator = this.bitwig.transport.timeSignature().denominator().get();
        const numberOfBars = ((postRecordingOffset / 4) / numerator) * denominator;
        const light1 = numberOfBars % 2;
        const light2 = (numberOfBars >> 1) % 2;
        const light3 = (numberOfBars >> 2) % 2;
        const light4 = (numberOfBars >> 3) % 2;
        const light5 = (numberOfBars >> 4) % 2;
        this.controller.setLight({ row: 6, column: 0, color: light1 ? "blue" : "off" });
        this.controller.setLight({ row: 6, column: 1, color: light2 ? "blue" : "off" });
        this.controller.setLight({ row: 6, column: 2, color: light3 ? "blue" : "off" });
        this.controller.setLight({ row: 6, column: 3, color: light4 ? "blue" : "off" });
        this.controller.setLight({ row: 6, column: 4, color: light5 ? "blue" : "off" });
    }
    handleMidi(midi) {
        println(String(midi.data1));
        const noteBase = 35;
        const button = midi.data1 - noteBase;
        if (button < 0 || button > 4) {
            return false;
        }
        if (midi.type === NOTE_OFF) {
            __classPrivateFieldGet(this, _LoopLength_pressedButtons, "f")[button] = false;
            if (__classPrivateFieldGet(this, _LoopLength_pressedButtons, "f").every(button => button === false)) {
                // Interaction ended
                if (__classPrivateFieldGet(this, _LoopLength_bars, "f") == __classPrivateFieldGet(this, _LoopLength_nextBars, "f")) {
                    // disable
                    __classPrivateFieldSet(this, _LoopLength_bars, 0, "f");
                }
                else {
                    __classPrivateFieldSet(this, _LoopLength_bars, __classPrivateFieldGet(this, _LoopLength_nextBars, "f"), "f");
                }
                __classPrivateFieldSet(this, _LoopLength_nextBars, 0, "f");
                this.setLoopLength();
            }
            return true;
        }
        if (midi.type === NOTE_ON) {
            __classPrivateFieldGet(this, _LoopLength_pressedButtons, "f")[button] = true;
            __classPrivateFieldSet(this, _LoopLength_nextBars, __classPrivateFieldGet(this, _LoopLength_nextBars, "f") + (1 << button), "f");
            return true;
        }
        return false;
    }
}
_LoopLength_bars = new WeakMap(), _LoopLength_nextBars = new WeakMap(), _LoopLength_pressedButtons = new WeakMap();
class UndoRedo extends ControllerModule {
    init() {
        this.addInitCallback(() => {
            // set undo button light
            this.controller.setLight({ row: 7, column: 1, color: "magenta" });
            // set redo button light
            this.controller.setLight({ row: 7, column: 2, color: "blue" });
        });
    }
    handleMidi(midi) {
        if (midi.type === NOTE_ON && midi.data1 === 31) {
            this.bitwig.application.undo();
            return true;
        }
        if (midi.type === NOTE_ON && midi.data1 === 32) {
            this.bitwig.application.redo();
            return true;
        }
        return false;
    }
}
class OverdubToggle extends ControllerModule {
    init() {
        this.addValueObserver(this.bitwig.transport.isClipLauncherOverdubEnabled(), () => {
            const isOverdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().get();
            this.controller.setLight({ row: 7, column: 0, color: isOverdubEnabled ? "red" : "white" });
        });
    }
    handleMidi(midi) {
        if (midi.type === NOTE_ON && midi.data1 === 30) {
            const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean();
            this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled);
            return true;
        }
        return false;
    }
}
class InterfaceToggle extends ControllerModule {
    init() {
        this.addInitCallback(() => {
            if (this.controller.isInterfaceEnabled()) {
                println("EL DE ARRIBA");
                this.controller.setLight({ row: 7, column: 3, color: 'yellow' });
            }
            else {
                println("EL DE ABAJO");
                this.controller.setLight({ row: 7, column: 0, color: 'yellow' }, true);
            }
        });
    }
    handleMidi(midi) {
        if (this.controller.isInterfaceEnabled()) {
            if (midi.type === NOTE_ON && midi.data1 === 33) {
                this.controller.toggleInterface();
                return true;
            }
            return false;
        }
        if (midi.type === NOTE_ON && midi.data1 === 30) {
            this.controller.toggleInterface();
            return true;
        }
        this.controller.midiToDaw(midi);
        return true;
    }
}
class Metronome extends ControllerModule {
    constructor() {
        super(...arguments);
        _Metronome_instances.add(this);
    }
    init() {
        this.addValueObserver(this.bitwig.transport.isMetronomeEnabled(), () => {
            const metronomeEnabled = this.bitwig.transport.isMetronomeEnabled().get();
            this.controller.setLight({ row: 7, column: 4, color: metronomeEnabled ? "orange" : "blue" });
        });
    }
    handleMidi(midi) {
        if (midi.type === NOTE_ON && midi.data1 === 34) {
            this.pressHandler.handlePressBegin(() => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onTap).call(this), () => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onLongPress).call(this), 500, midi.data1);
            return true;
        }
        if (midi.type === NOTE_OFF && midi.data1 === 34) {
            this.pressHandler.handlePressEnd(midi.data1);
            return true;
        }
        return false;
    }
}
_Metronome_instances = new WeakSet(), _Metronome_onTap = function _Metronome_onTap() {
    this.bitwig.transport.tapTempo();
}, _Metronome_onLongPress = function _Metronome_onLongPress() {
    this.bitwig.transport.isMetronomeEnabled().toggle();
};
class LiveLoopingController {
    constructor(bitwig, pressHandler, linnstrument, modules) {
        _LiveLoopingController_interfaceEnabled.set(this, void 0);
        _LiveLoopingController_noteInput.set(this, void 0);
        _LiveLoopingController_linn.set(this, void 0);
        _LiveLoopingController_modules.set(this, void 0);
        this.bitwig = bitwig;
        this.pressHandler = pressHandler;
        __classPrivateFieldSet(this, _LiveLoopingController_linn, linnstrument, "f");
        __classPrivateFieldSet(this, _LiveLoopingController_modules, modules.map(module => new module(bitwig, pressHandler, linnstrument, this)), "f");
        __classPrivateFieldSet(this, _LiveLoopingController_interfaceEnabled, true, "f");
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").turnOffLights();
        this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
        // Channel 0: Used to control bitwig
        // Channels 1-15: Used for MPE
        __classPrivateFieldSet(this, _LiveLoopingController_noteInput, this.bitwig.host.getMidiInPort(0)
            .createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????"), "f");
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setUseExpressiveMidi(true, 0, 48);
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").forEach(module => module.init());
    }
    midiToDaw(midi) {
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").sendRawMidiEvent(midi.type << 4, midi.data1, midi.data2);
    }
    handleMidi(status, data1, data2) {
        const type = status >> 4;
        const channel = status % 16;
        // Pass the midi message to each module.handleMidi until one returns true
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").some(module => module.handleMidi({ type, channel, data1, data2 }));
    }
    toggleInterface() {
        __classPrivateFieldSet(this, _LiveLoopingController_interfaceEnabled, !__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f"), "f");
        this.forceUpdate();
    }
    isInterfaceEnabled() {
        return __classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f");
    }
    forceUpdate() {
        if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").turnOffLights();
        }
        else {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").resetLights();
        }
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").forEach(module => module.update());
    }
    setLight(options, force = false) {
        if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f") || force) {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setLight(options);
        }
    }
}
_LiveLoopingController_interfaceEnabled = new WeakMap(), _LiveLoopingController_noteInput = new WeakMap(), _LiveLoopingController_linn = new WeakMap(), _LiveLoopingController_modules = new WeakMap();
//  _______  _______  ______    ___   _______  _______
// |       ||       ||    _ |  |   | |       ||       |
// |  _____||       ||   | ||  |   | |    _  ||_     _|
// | |_____ |       ||   |_||_ |   | |   |_| |  |   |
// |_____  ||      _||    __  ||   | |    ___|  |   |
//  _____| ||     |_ |   |  | ||   | |   |      |   |
// |_______||_______||___|  |_||___| |___|      |___|
// Creates objects, injects dependencies, and does some setup
loadAPI(17);
host.setShouldFailOnDeprecatedUse(true);
host.defineController("Roger Linn Design", "LinnstrumentLooping", "0.1", "e72dbb9b-ba1c-405e-998e-6a96dee48830", "OliverLSanz");
host.defineMidiPorts(1, 1);
function init() {
    const taskManager = new TaskManager(host);
    const pressHandler = new PressHandler(taskManager);
    const bitwig = new Bitwig(host);
    const linn = new LinnStrument(bitwig);
    const modules = [
        InterfaceToggle,
        TracksRow,
        ClipArray,
        LoopLength,
        OverdubToggle,
        UndoRedo,
        Metronome,
    ];
    new LiveLoopingController(bitwig, pressHandler, linn, modules);
    println("LinnstrumentLooping initialized!");
}
function flush() {
    // Flush any output to your controller here.
}
function exit() {
    // This gets called on exit
}
