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
var _LinnStrument_bitwig, _TaskManager_scheduledTasks, _TaskManager_host, _ControllerModule_onUpdate, _TracksRow_baseButton, _ClipArray_instances, _ClipArray_updateClipLight, _LoopLength_bars, _LoopLength_nextBars, _LoopLength_pressedButtons, _UndoRedo_buttonIndex, _InterfaceToggle_buttonWhileEnabled, _InterfaceToggle_buttonWhileDisabled, _Metronome_instances, _Metronome_button, _Metronome_onTap, _Metronome_onLongPress, _LiveLoopingController_instances, _LiveLoopingController_keyTranslationTable, _LiveLoopingController_noteInput, _LiveLoopingController_interfaceEnabled, _LiveLoopingController_linn, _LiveLoopingController_modules, _LiveLoopingController_buttonToNote, _LiveLoopingController_setPlayAreaLights;
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
    constructor() {
        super(...arguments);
        _TracksRow_baseButton.set(this, 112);
    }
    init() {
        for (let trackIndex = 0; trackIndex < 5; trackIndex++) {
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            this.addValueObserver(track.arm(), () => {
                const isArmed = track.arm().get();
                this.controller.setButtonLight(__classPrivateFieldGet(this, _TracksRow_baseButton, "f") + trackIndex, isArmed ? "magenta" : "off");
            });
        }
    }
    handleMidi(midi) {
        // SWITCH TRACKS
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _TracksRow_baseButton, "f")) {
            this.bitwig.armTrack(0);
        }
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _TracksRow_baseButton, "f") + 1) {
            this.bitwig.armTrack(1);
        }
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _TracksRow_baseButton, "f") + 2) {
            this.bitwig.armTrack(2);
        }
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _TracksRow_baseButton, "f") + 3) {
            this.bitwig.armTrack(3);
        }
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _TracksRow_baseButton, "f") + 4) {
            this.bitwig.armTrack(4);
        }
        return false;
    }
}
_TracksRow_baseButton = new WeakMap();
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
        const buttonRow = Math.floor(midi.data1 / 16);
        if (buttonRow > 3 && buttonRow < 7 && midi.data1 % 16 < 5) {
            if (midi.type === NOTE_ON) {
                const trackIndex = midi.data1 % 16;
                const clipIndex = 6 - buttonRow;
                const track = this.bitwig.tracks.getItemAt(trackIndex);
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
            }
            if (midi.type === NOTE_OFF) {
                this.pressHandler.handlePressEnd(midi.data1);
            }
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
        const noteBase = 16;
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
    constructor() {
        super(...arguments);
        _UndoRedo_buttonIndex.set(this, 3);
    }
    init() {
        this.addInitCallback(() => {
            this.controller.setButtonLight(__classPrivateFieldGet(this, _UndoRedo_buttonIndex, "f"), "magenta");
        });
    }
    handleMidi(midi) {
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _UndoRedo_buttonIndex, "f")) {
            this.pressHandler.handlePressBegin(() => this.bitwig.application.undo(), () => this.bitwig.application.redo(), 500, midi.data1);
            return true;
        }
        if (midi.type === NOTE_OFF && midi.data1 === __classPrivateFieldGet(this, _UndoRedo_buttonIndex, "f")) {
            this.pressHandler.handlePressEnd(midi.data1);
            return true;
        }
        return false;
    }
}
_UndoRedo_buttonIndex = new WeakMap();
class OverdubToggle extends ControllerModule {
    init() {
        this.addValueObserver(this.bitwig.transport.isClipLauncherOverdubEnabled(), () => {
            const isOverdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().get();
            this.controller.setLight({ row: 7, column: 0, color: isOverdubEnabled ? "red" : "white" });
        });
    }
    handleMidi(midi) {
        if (this.controller.isInterfaceEnabled()) {
            if (midi.type === NOTE_ON && midi.data1 === 0) {
                const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean();
                this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled);
                return true;
            }
        }
        return false;
    }
}
class InterfaceToggle extends ControllerModule {
    constructor() {
        super(...arguments);
        _InterfaceToggle_buttonWhileEnabled.set(this, 4);
        _InterfaceToggle_buttonWhileDisabled.set(this, 0);
    }
    init() {
        this.addInitCallback(() => {
            if (this.controller.isInterfaceEnabled()) {
                this.controller.setButtonLight(__classPrivateFieldGet(this, _InterfaceToggle_buttonWhileEnabled, "f"), 'yellow');
            }
            else {
                this.controller.setButtonLight(__classPrivateFieldGet(this, _InterfaceToggle_buttonWhileDisabled, "f"), 'yellow', true);
            }
        });
    }
    handleMidi(midi) {
        if (this.controller.isInterfaceEnabled()) {
            if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _InterfaceToggle_buttonWhileEnabled, "f")) {
                this.controller.toggleInterface();
                return true;
            }
            return false;
        }
        println(String(midi.data1));
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _InterfaceToggle_buttonWhileDisabled, "f")) {
            this.controller.toggleInterface();
            return true;
        }
        return false;
    }
}
_InterfaceToggle_buttonWhileEnabled = new WeakMap(), _InterfaceToggle_buttonWhileDisabled = new WeakMap();
class Metronome extends ControllerModule {
    constructor() {
        super(...arguments);
        _Metronome_instances.add(this);
        _Metronome_button.set(this, 1);
    }
    init() {
        this.addValueObserver(this.bitwig.transport.isMetronomeEnabled(), () => {
            const metronomeEnabled = this.bitwig.transport.isMetronomeEnabled().get();
            this.controller.setButtonLight(__classPrivateFieldGet(this, _Metronome_button, "f"), metronomeEnabled ? "orange" : "white");
        });
    }
    handleMidi(midi) {
        if (midi.type === NOTE_ON && midi.data1 === __classPrivateFieldGet(this, _Metronome_button, "f")) {
            this.pressHandler.handlePressBegin(() => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onTap).call(this), () => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onLongPress).call(this), 500, midi.data1);
            return true;
        }
        if (midi.type === NOTE_OFF && midi.data1 === __classPrivateFieldGet(this, _Metronome_button, "f")) {
            this.pressHandler.handlePressEnd(midi.data1);
            return true;
        }
        return false;
    }
}
_Metronome_button = new WeakMap(), _Metronome_instances = new WeakSet(), _Metronome_onTap = function _Metronome_onTap() {
    this.bitwig.transport.tapTempo();
}, _Metronome_onLongPress = function _Metronome_onLongPress() {
    this.bitwig.transport.isMetronomeEnabled().toggle();
};
class LiveLoopingController {
    constructor(bitwig, pressHandler, linnstrument, modules) {
        _LiveLoopingController_instances.add(this);
        _LiveLoopingController_keyTranslationTable.set(this, void 0);
        _LiveLoopingController_noteInput.set(this, void 0);
        _LiveLoopingController_interfaceEnabled.set(this, void 0);
        _LiveLoopingController_linn.set(this, void 0);
        _LiveLoopingController_modules.set(this, void 0);
        this.bitwig = bitwig;
        this.pressHandler = pressHandler;
        __classPrivateFieldSet(this, _LiveLoopingController_linn, linnstrument, "f");
        __classPrivateFieldSet(this, _LiveLoopingController_modules, modules.map(module => new module(bitwig, pressHandler, linnstrument, this)), "f");
        __classPrivateFieldSet(this, _LiveLoopingController_interfaceEnabled, true, "f");
        __classPrivateFieldSet(this, _LiveLoopingController_keyTranslationTable, [], "f");
        for (let key = 0; key < 128; key++) {
            if (key % 16 > 4) {
                __classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f").push(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, key));
            }
            else {
                __classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f").push(-1);
            }
        }
        // this.#linn.turnOffLights()
        this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
        this.bitwig.host.getMidiInPort(0);
        __classPrivateFieldSet(this, _LiveLoopingController_noteInput, this.bitwig.host.getMidiInPort(0).createNoteInput("LinnStrument", "??????"), "f");
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setUseExpressiveMidi(true, 0, 24);
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setKeyTranslationTable(__classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f"));
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_setPlayAreaLights).call(this);
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").forEach(module => module.init());
    }
    setButtonLight(button, color, force) {
        const buttonOffset = 0; // number of the first button
        const buttonsPerRow = 16;
        const row = Math.floor((button - buttonOffset) / buttonsPerRow);
        const column = button - row * buttonsPerRow;
        this.setLight({ row: 7 - row, column: column, color }, force);
    }
    forwardButton(buttonIndex, forward) {
        __classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f")[buttonIndex] = forward ? buttonIndex : -1;
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setKeyTranslationTable(__classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f"));
    }
    handleMidi(status, data1, data2) {
        const type = status >> 4;
        const channel = status % 16;
        // Pass the midi message to each module.handleMidi until one returns true
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").some(module => module.handleMidi({ type, channel, data1, data2 }));
    }
    toggleInterface() {
        const newTranslationTable = [];
        if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
            for (let key = 0; key < 128; key++) {
                if (key != 0) {
                    newTranslationTable.push(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, key));
                }
                else {
                    newTranslationTable.push(-1);
                }
            }
        }
        else {
            for (let key = 0; key < 128; key++) {
                if (key % 16 > 4) {
                    newTranslationTable.push(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, key));
                }
                else {
                    newTranslationTable.push(-1);
                }
            }
        }
        __classPrivateFieldSet(this, _LiveLoopingController_keyTranslationTable, newTranslationTable, "f");
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setKeyTranslationTable(__classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f"));
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
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_setPlayAreaLights).call(this);
    }
    setLight(options, force = false) {
        if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f") || force) {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setLight(options);
        }
    }
}
_LiveLoopingController_keyTranslationTable = new WeakMap(), _LiveLoopingController_noteInput = new WeakMap(), _LiveLoopingController_interfaceEnabled = new WeakMap(), _LiveLoopingController_linn = new WeakMap(), _LiveLoopingController_modules = new WeakMap(), _LiveLoopingController_instances = new WeakSet(), _LiveLoopingController_buttonToNote = function _LiveLoopingController_buttonToNote(buttonIndex) {
    const buttonOffset = 0; // number of the first button
    const noteOffset = 30; // number of the first note
    const buttonsPerRow = 16;
    const rowOffset = 5; // Distance in semitomes while going 1 row up
    const rowDecrement = buttonsPerRow - rowOffset;
    const currentRow = Math.floor((buttonIndex - buttonOffset) / buttonsPerRow);
    const rowAdjustment = currentRow * rowDecrement;
    const note = buttonIndex - buttonOffset - rowAdjustment + noteOffset;
    return note;
}, _LiveLoopingController_setPlayAreaLights = function _LiveLoopingController_setPlayAreaLights() {
    const module = 12;
    println(String(__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")));
    if (this.isInterfaceEnabled()) {
        for (let button = 0; button < __classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f").length; button++) {
            if (button % 16 > 4 && __classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f")[button] % module === 0) {
                this.setButtonLight(button, "orange", true);
            }
        }
    }
    else {
        for (let button = 0; button < __classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f").length; button++) {
            if (__classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f")[button] % module === 0) {
                this.setButtonLight(button, "orange", true);
            }
        }
    }
};
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
        TracksRow,
        ClipArray,
        LoopLength,
        UndoRedo,
        OverdubToggle,
        InterfaceToggle,
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
