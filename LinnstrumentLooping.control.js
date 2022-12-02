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
var _LinnStrument_bitwig, _TaskManager_scheduledTasks, _TaskManager_host, _ControllerModule_onUpdate, _TracksRow_row, _TracksRow_column, _TracksRow_numberOfTracks, _ClipArray_instances, _ClipArray_row, _ClipArray_column, _ClipArray_numberOfTracks, _ClipArray_clipsPerTrack, _ClipArray_updateClipLight, _LoopLength_row, _LoopLength_column, _LoopLength_bars, _LoopLength_nextBars, _LoopLength_pressedButtons, _UndoRedo_row, _UndoRedo_column, _OverdubToggle_row, _OverdubToggle_column, _InterfaceToggle_rowWhileEnabled, _InterfaceToggle_columnWhileEnabled, _InterfaceToggle_rowWhileDisabled, _InterfaceToggle_columnWhileDisabled, _Metronome_instances, _Metronome_row, _Metronome_column, _Metronome_onTap, _Metronome_onLongPress, _LiveLoopingController_instances, _LiveLoopingController_keyTranslationTable, _LiveLoopingController_noteInput, _LiveLoopingController_interfaceEnabled, _LiveLoopingController_linn, _LiveLoopingController_modules, _LiveLoopingController_width, _LiveLoopingController_height, _LiveLoopingController_noteOffset, _LiveLoopingController_controlAreaWidth, _LiveLoopingController_collapsedControlAreaWidth, _LiveLoopingController_expandedControlAreaWidth, _LiveLoopingController_rowOffset, _LiveLoopingController_noteColors, _LiveLoopingController_firstControlAreaButton, _LiveLoopingController_configureLinnstrument, _LiveLoopingController_getPlayAreaWidth, _LiveLoopingController_buttonToNote, _LiveLoopingController_setPlayAreaLights, _LiveLoopingController_updateKeyTranslationTable, _LiveLoopingController_update;
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
const MAX_MIDI_NOTE = 127;
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
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
    sendNRPN(number, value) {
        const MSBNumber = number >> 7;
        const LSBNumber = number % 128;
        const MSBValue = value >> 7;
        const LSBValue = value % 128;
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 99, data2: MSBNumber });
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 98, data2: LSBNumber });
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 6, data2: MSBValue });
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 38, data2: LSBValue });
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 101, data2: 127 });
        __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: CC, channel: 0, data1: 100, data2: 127 });
        sleep(50);
    }
    setMidiMode(mode, split) {
        let value;
        if (mode == "OneChannel") {
            value = 0;
        }
        else if (mode == "ChannelPerNote") {
            value = 1;
        }
        else {
            value = 2;
        }
        this.sendNRPN(split == "left" ? 0 : 100, value);
    }
    /**
     *
     * @param value only supports, 0: No overlap, 3 4 5 6 7 12: Intervals, 13: Guitar, 127: 0 offset
     */
    setRowOffset(value) {
        this.sendNRPN(227, value);
    }
    /**
     *
     * @param channel From 0 to 15
     */
    setMidiMainChannel(channel, split) {
        this.sendNRPN(split == "left" ? 1 : 101, channel + 1);
    }
    /**
     *
     * @param channel From 0 to 15
     * @param enabled
     */
    setMidiPerNoteChannel(channel, enabled, split) {
        this.sendNRPN(split == "left" ? 2 + channel : 102 + channel, enabled ? 1 : 0);
    }
    /**
     *
     * @param range From 1 to 96
     */
    setMidiBendRange(range, split) {
        this.sendNRPN(split === "left" ? 19 : 119, range);
    }
    /**
     *
     * @param octaves 0-10, 5 is +0
     * @param semitones 0-14, 0-6: -7 to -1, 7: 0, 8-14: +1 to +7
     */
    setTransposition(octaves, semitones) {
        // Left Octave
        this.sendNRPN(36, octaves);
        // Left Pitch
        this.sendNRPN(37, semitones);
        // Right Octave
        this.sendNRPN(136, octaves);
        // Right Pitch
        this.sendNRPN(137, semitones);
    }
    setSplitActive(active) {
        this.sendNRPN(200, active ? 1 : 0);
    }
    /**
     *
     * @param column Start of second split: 2-25
     */
    setSplitPoint(column) {
        this.sendNRPN(202, column);
    }
    setSelectedSplit(split) {
        this.sendNRPN(201, split == "left" ? 0 : 1);
    }
    // Below this line: unused and not tested
    setPitchQuantize(enabled, split) {
        this.sendNRPN(split == "left" ? 21 : 121, enabled ? 1 : 0);
    }
    setPitchQuantizeHold(mode, split) {
        const translation = {
            "Off": 0, "Medium": 1, "Fast": 2, "Slow": 3
        };
        this.sendNRPN(split == "left" ? 22 : 122, translation[mode]);
    }
    setSendX(enabled, split) {
        this.sendNRPN(split == "left" ? 20 : 120, enabled ? 1 : 0);
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
        _TracksRow_row.set(this, 0);
        _TracksRow_column.set(this, 0);
        _TracksRow_numberOfTracks.set(this, 5);
    }
    init() {
        for (let trackIndex = 0; trackIndex < __classPrivateFieldGet(this, _TracksRow_numberOfTracks, "f"); trackIndex++) {
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            this.addValueObserver(track.arm(), () => {
                const isArmed = track.arm().get();
                this.controller.setLight({ row: __classPrivateFieldGet(this, _TracksRow_row, "f"), column: __classPrivateFieldGet(this, _TracksRow_column, "f") + trackIndex, color: isArmed ? "magenta" : "off" });
            });
        }
    }
    handleMidi(midi) {
        // SWITCH TRACKS
        const baseButton = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _TracksRow_row, "f"), column: __classPrivateFieldGet(this, _TracksRow_column, "f") });
        for (let trackIndex = 0; trackIndex < __classPrivateFieldGet(this, _TracksRow_numberOfTracks, "f"); trackIndex++) {
            if (midi.type === NOTE_ON && midi.data1 === baseButton + trackIndex) {
                this.bitwig.armTrack(trackIndex);
                return true;
            }
        }
        return false;
    }
}
_TracksRow_row = new WeakMap(), _TracksRow_column = new WeakMap(), _TracksRow_numberOfTracks = new WeakMap();
class ClipArray extends ControllerModule {
    constructor() {
        super(...arguments);
        _ClipArray_instances.add(this);
        _ClipArray_row.set(this, 1);
        _ClipArray_column.set(this, 0);
        _ClipArray_numberOfTracks.set(this, 5);
        _ClipArray_clipsPerTrack.set(this, 3);
    }
    init() {
        // Start observers
        for (let trackIndex = 0; trackIndex < __classPrivateFieldGet(this, _ClipArray_numberOfTracks, "f"); trackIndex++) {
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            for (let clipIndex = 0; clipIndex < __classPrivateFieldGet(this, _ClipArray_clipsPerTrack, "f"); clipIndex++) {
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
        const { row, column } = this.controller.controlSplitButtonToCoordinate(midi.data1);
        if (row >= __classPrivateFieldGet(this, _ClipArray_row, "f") && row < __classPrivateFieldGet(this, _ClipArray_row, "f") + __classPrivateFieldGet(this, _ClipArray_clipsPerTrack, "f")
            && column >= __classPrivateFieldGet(this, _ClipArray_column, "f") && column < __classPrivateFieldGet(this, _ClipArray_column, "f") + __classPrivateFieldGet(this, _ClipArray_numberOfTracks, "f")) {
            if (midi.type === NOTE_ON) {
                const trackIndex = column - __classPrivateFieldGet(this, _ClipArray_column, "f");
                const clipIndex = row - __classPrivateFieldGet(this, _ClipArray_row, "f");
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
_ClipArray_row = new WeakMap(), _ClipArray_column = new WeakMap(), _ClipArray_numberOfTracks = new WeakMap(), _ClipArray_clipsPerTrack = new WeakMap(), _ClipArray_instances = new WeakSet(), _ClipArray_updateClipLight = function _ClipArray_updateClipLight(trackIndex, track, clipIndex) {
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
        _LoopLength_row.set(this, 6);
        _LoopLength_column.set(this, 0);
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
        this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_row, "f"), column: __classPrivateFieldGet(this, _LoopLength_column, "f"), color: light1 ? "blue" : "off" });
        this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_row, "f"), column: __classPrivateFieldGet(this, _LoopLength_column, "f") + 1, color: light2 ? "blue" : "off" });
        this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_row, "f"), column: __classPrivateFieldGet(this, _LoopLength_column, "f") + 2, color: light3 ? "blue" : "off" });
        this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_row, "f"), column: __classPrivateFieldGet(this, _LoopLength_column, "f") + 3, color: light4 ? "blue" : "off" });
        this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_row, "f"), column: __classPrivateFieldGet(this, _LoopLength_column, "f") + 4, color: light5 ? "blue" : "off" });
    }
    handleMidi(midi) {
        const baseNote = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _LoopLength_row, "f"), column: __classPrivateFieldGet(this, _LoopLength_column, "f") });
        const receivedNote = midi.data1;
        const button = receivedNote - baseNote;
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
_LoopLength_row = new WeakMap(), _LoopLength_column = new WeakMap(), _LoopLength_bars = new WeakMap(), _LoopLength_nextBars = new WeakMap(), _LoopLength_pressedButtons = new WeakMap();
class UndoRedo extends ControllerModule {
    constructor() {
        super(...arguments);
        _UndoRedo_row.set(this, 7);
        _UndoRedo_column.set(this, 3);
    }
    init() {
        this.addInitCallback(() => {
            this.controller.setLight({ row: __classPrivateFieldGet(this, _UndoRedo_row, "f"), column: __classPrivateFieldGet(this, _UndoRedo_column, "f"), color: "magenta" });
        });
    }
    handleMidi(midi) {
        const buttonNote = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _UndoRedo_row, "f"), column: __classPrivateFieldGet(this, _UndoRedo_column, "f") });
        if (midi.type === NOTE_ON && midi.data1 === buttonNote) {
            this.pressHandler.handlePressBegin(() => this.bitwig.application.undo(), () => this.bitwig.application.redo(), 500, midi.data1);
            return true;
        }
        if (midi.type === NOTE_OFF && midi.data1 === buttonNote) {
            this.pressHandler.handlePressEnd(midi.data1);
            return true;
        }
        return false;
    }
}
_UndoRedo_row = new WeakMap(), _UndoRedo_column = new WeakMap();
class OverdubToggle extends ControllerModule {
    constructor() {
        super(...arguments);
        _OverdubToggle_row.set(this, 7);
        _OverdubToggle_column.set(this, 0);
    }
    init() {
        this.addValueObserver(this.bitwig.transport.isClipLauncherOverdubEnabled(), () => {
            const isOverdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().get();
            this.controller.setLight({ row: __classPrivateFieldGet(this, _OverdubToggle_row, "f"), column: __classPrivateFieldGet(this, _OverdubToggle_column, "f"), color: isOverdubEnabled ? "red" : "white" });
        });
    }
    handleMidi(midi) {
        const buttonNote = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _OverdubToggle_row, "f"), column: __classPrivateFieldGet(this, _OverdubToggle_column, "f") });
        if (this.controller.isInterfaceEnabled()) {
            if (midi.type === NOTE_ON && midi.data1 === buttonNote) {
                const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean();
                this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled);
                return true;
            }
        }
        return false;
    }
}
_OverdubToggle_row = new WeakMap(), _OverdubToggle_column = new WeakMap();
class InterfaceToggle extends ControllerModule {
    constructor() {
        super(...arguments);
        _InterfaceToggle_rowWhileEnabled.set(this, 7);
        _InterfaceToggle_columnWhileEnabled.set(this, 4);
        _InterfaceToggle_rowWhileDisabled.set(this, 7);
        _InterfaceToggle_columnWhileDisabled.set(this, 0);
    }
    init() {
        this.addInitCallback(() => {
            if (this.controller.isInterfaceEnabled()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _InterfaceToggle_rowWhileEnabled, "f"), column: __classPrivateFieldGet(this, _InterfaceToggle_columnWhileEnabled, "f"), color: 'yellow' });
            }
            else {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _InterfaceToggle_rowWhileDisabled, "f"), column: __classPrivateFieldGet(this, _InterfaceToggle_columnWhileDisabled, "f"), color: 'yellow' }, true);
            }
        });
    }
    handleMidi(midi) {
        const buttonWhileEnabled = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _InterfaceToggle_rowWhileEnabled, "f"), column: __classPrivateFieldGet(this, _InterfaceToggle_columnWhileEnabled, "f") });
        const buttonWhileDisabled = 0;
        if (this.controller.isInterfaceEnabled()) {
            if (midi.type === NOTE_ON && midi.data1 === buttonWhileEnabled) {
                this.controller.toggleInterface();
                return true;
            }
            return false;
        }
        if (midi.type === NOTE_ON && midi.data1 === buttonWhileDisabled) {
            this.controller.toggleInterface();
            return true;
        }
        return false;
    }
}
_InterfaceToggle_rowWhileEnabled = new WeakMap(), _InterfaceToggle_columnWhileEnabled = new WeakMap(), _InterfaceToggle_rowWhileDisabled = new WeakMap(), _InterfaceToggle_columnWhileDisabled = new WeakMap();
class Metronome extends ControllerModule {
    constructor() {
        super(...arguments);
        _Metronome_instances.add(this);
        _Metronome_row.set(this, 7);
        _Metronome_column.set(this, 1);
    }
    init() {
        this.addValueObserver(this.bitwig.transport.isMetronomeEnabled(), () => {
            const metronomeEnabled = this.bitwig.transport.isMetronomeEnabled().get();
            this.controller.setLight({ row: __classPrivateFieldGet(this, _Metronome_row, "f"), column: __classPrivateFieldGet(this, _Metronome_column, "f"), color: metronomeEnabled ? "orange" : "white" });
        });
    }
    handleMidi(midi) {
        const button = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _Metronome_row, "f"), column: __classPrivateFieldGet(this, _Metronome_column, "f") });
        if (midi.type === NOTE_ON && midi.data1 === button) {
            this.pressHandler.handlePressBegin(() => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onTap).call(this), () => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onLongPress).call(this), 500, midi.data1);
            return true;
        }
        if (midi.type === NOTE_OFF && midi.data1 === button) {
            this.pressHandler.handlePressEnd(midi.data1);
            return true;
        }
        return false;
    }
}
_Metronome_row = new WeakMap(), _Metronome_column = new WeakMap(), _Metronome_instances = new WeakSet(), _Metronome_onTap = function _Metronome_onTap() {
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
        _LiveLoopingController_width.set(this, 16);
        _LiveLoopingController_height.set(this, 8);
        _LiveLoopingController_noteOffset.set(this, 30); // note played by the lowest key in the play area
        _LiveLoopingController_controlAreaWidth.set(this, 5);
        _LiveLoopingController_collapsedControlAreaWidth.set(this, 0);
        _LiveLoopingController_expandedControlAreaWidth.set(this, 5);
        _LiveLoopingController_rowOffset.set(this, 5); // distance in semitomes while going 1 row up
        _LiveLoopingController_noteColors.set(this, ['orange', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off']);
        _LiveLoopingController_firstControlAreaButton.set(this, 0);
        this.bitwig = bitwig;
        this.pressHandler = pressHandler;
        __classPrivateFieldSet(this, _LiveLoopingController_linn, linnstrument, "f");
        this.linn = linnstrument;
        __classPrivateFieldSet(this, _LiveLoopingController_modules, modules.map(module => new module(bitwig, pressHandler, linnstrument, this)), "f");
        __classPrivateFieldSet(this, _LiveLoopingController_interfaceEnabled, true, "f");
        __classPrivateFieldSet(this, _LiveLoopingController_keyTranslationTable, [], "f");
        this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
        this.bitwig.host.getMidiInPort(0);
        __classPrivateFieldSet(this, _LiveLoopingController_noteInput, this.bitwig.host.getMidiInPort(0).createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????"), "f");
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setUseExpressiveMidi(true, 0, 24);
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_configureLinnstrument).call(this);
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").forEach(module => module.init());
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
    }
    coordinateToControlSplitButton({ row, column }) {
        if (!__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
            return 999;
        }
        return __classPrivateFieldGet(this, _LiveLoopingController_firstControlAreaButton, "f") + (7 - row) * __classPrivateFieldGet(this, _LiveLoopingController_controlAreaWidth, "f") + column;
    }
    controlSplitButtonToCoordinate(button) {
        const row = 7 - Math.floor((button - __classPrivateFieldGet(this, _LiveLoopingController_firstControlAreaButton, "f")) / __classPrivateFieldGet(this, _LiveLoopingController_controlAreaWidth, "f"));
        const column = button % __classPrivateFieldGet(this, _LiveLoopingController_controlAreaWidth, "f");
        return { row, column };
    }
    setButtonLight(button, color, force) {
        const buttonOffset = 0; // number of the first button
        const buttonsPerRow = 16;
        const row = Math.floor((button - buttonOffset) / buttonsPerRow);
        const column = button - row * buttonsPerRow;
        this.setLight({ row: 7 - row, column: column, color }, force);
    }
    handleMidi(status, data1, data2) {
        const type = status >> 4;
        const channel = status % 16;
        // Pass the midi message to each module.handleMidi until one returns true
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").some(module => module.handleMidi({ type, channel, data1, data2 }));
    }
    toggleInterface() {
        __classPrivateFieldSet(this, _LiveLoopingController_interfaceEnabled, !__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f"), "f");
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
    }
    isInterfaceEnabled() {
        return __classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f");
    }
    setLight(options, force = false) {
        if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f") || force) {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setLight(options);
        }
    }
}
_LiveLoopingController_keyTranslationTable = new WeakMap(), _LiveLoopingController_noteInput = new WeakMap(), _LiveLoopingController_interfaceEnabled = new WeakMap(), _LiveLoopingController_linn = new WeakMap(), _LiveLoopingController_modules = new WeakMap(), _LiveLoopingController_width = new WeakMap(), _LiveLoopingController_height = new WeakMap(), _LiveLoopingController_noteOffset = new WeakMap(), _LiveLoopingController_controlAreaWidth = new WeakMap(), _LiveLoopingController_collapsedControlAreaWidth = new WeakMap(), _LiveLoopingController_expandedControlAreaWidth = new WeakMap(), _LiveLoopingController_rowOffset = new WeakMap(), _LiveLoopingController_noteColors = new WeakMap(), _LiveLoopingController_firstControlAreaButton = new WeakMap(), _LiveLoopingController_instances = new WeakSet(), _LiveLoopingController_configureLinnstrument = function _LiveLoopingController_configureLinnstrument() {
    // Global settings
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setRowOffset(0);
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setTransposition(3, 1);
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitActive(true);
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitPoint(6);
    // Left split
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiBendRange(48, 'left');
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiMode("OneChannel", 'left');
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiMainChannel(0, 'left');
    // Right split
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiBendRange(48, 'right');
    __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiMode("ChannelPerNote", 'right');
    Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15).forEach(i => {
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiPerNoteChannel(i, true, 'right');
    });
}, _LiveLoopingController_getPlayAreaWidth = function _LiveLoopingController_getPlayAreaWidth() {
    return __classPrivateFieldGet(this, _LiveLoopingController_width, "f") - __classPrivateFieldGet(this, _LiveLoopingController_controlAreaWidth, "f");
}, _LiveLoopingController_buttonToNote = function _LiveLoopingController_buttonToNote(buttonIndex) {
    let interfaceOffset = 0;
    // This ensures the same notes are played by the same buttons
    // regardless of the interface state
    if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
        const columnDifference = __classPrivateFieldGet(this, _LiveLoopingController_expandedControlAreaWidth, "f") - __classPrivateFieldGet(this, _LiveLoopingController_collapsedControlAreaWidth, "f");
        interfaceOffset = columnDifference;
    }
    const rowDecrement = __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) - __classPrivateFieldGet(this, _LiveLoopingController_rowOffset, "f");
    const currentRow = Math.floor((buttonIndex) / __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this));
    const rowAdjustment = currentRow * rowDecrement;
    const note = buttonIndex - rowAdjustment + __classPrivateFieldGet(this, _LiveLoopingController_noteOffset, "f") + interfaceOffset;
    return note;
}, _LiveLoopingController_setPlayAreaLights = function _LiveLoopingController_setPlayAreaLights() {
    for (let row = 0; row < __classPrivateFieldGet(this, _LiveLoopingController_height, "f"); row++) {
        for (let column = 0; column < __classPrivateFieldGet(this, _LiveLoopingController_width, "f"); column++) {
            const playAreaColumn = column - __classPrivateFieldGet(this, _LiveLoopingController_controlAreaWidth, "f");
            if (playAreaColumn >= 0) {
                const playAreaButton = row * __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) + playAreaColumn;
                const note = __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, playAreaButton) % 12;
                const color = __classPrivateFieldGet(this, _LiveLoopingController_noteColors, "f")[note];
                this.setLight({ row: 7 - row, column: column, color }, true);
            }
        }
    }
}, _LiveLoopingController_updateKeyTranslationTable = function _LiveLoopingController_updateKeyTranslationTable() {
    const newTranslationTable = [];
    if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
        for (let key = 0; key <= MAX_MIDI_NOTE; key++) {
            newTranslationTable.push(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, key));
        }
    }
    else {
        for (let key = 0; key <= MAX_MIDI_NOTE; key++) {
            if (key != 0) {
                newTranslationTable.push(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, key));
            }
            else {
                newTranslationTable.push(-1);
            }
        }
    }
    __classPrivateFieldSet(this, _LiveLoopingController_keyTranslationTable, newTranslationTable, "f");
    __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setKeyTranslationTable(__classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f"));
}, _LiveLoopingController_update = function _LiveLoopingController_update() {
    if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
        __classPrivateFieldSet(this, _LiveLoopingController_controlAreaWidth, __classPrivateFieldGet(this, _LiveLoopingController_expandedControlAreaWidth, "f"), "f");
    }
    else {
        __classPrivateFieldSet(this, _LiveLoopingController_controlAreaWidth, __classPrivateFieldGet(this, _LiveLoopingController_collapsedControlAreaWidth, "f"), "f");
    }
    __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_updateKeyTranslationTable).call(this);
    if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitActive(true);
    }
    else {
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSelectedSplit("right");
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitActive(false);
    }
    if (__classPrivateFieldGet(this, _LiveLoopingController_interfaceEnabled, "f")) {
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").turnOffLights();
    }
    else {
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").resetLights();
    }
    __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_setPlayAreaLights).call(this);
    __classPrivateFieldGet(this, _LiveLoopingController_modules, "f").forEach(module => module.update());
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
