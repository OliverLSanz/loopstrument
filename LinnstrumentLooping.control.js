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
var _LinnStrument_bitwig, _TaskManager_scheduledTasks, _TaskManager_host, _LiveLoopingController_instances, _LiveLoopingController_updateClipLight;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PressHandler = exports.TaskManager = void 0;
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
exports.TaskManager = TaskManager;
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
exports.PressHandler = PressHandler;
//  _______  _______  __    _  _______  ______    _______  ___      ___      _______  ______
// |       ||       ||  |  | ||       ||    _ |  |       ||   |    |   |    |       ||    _ |
// |       ||   _   ||   |_| ||_     _||   | ||  |   _   ||   |    |   |    |    ___||   | ||
// |       ||  | |  ||       |  |   |  |   |_||_ |  | |  ||   |    |   |    |   |___ |   |_||_
// |      _||  |_|  ||  _    |  |   |  |    __  ||  |_|  ||   |___ |   |___ |    ___||    __  |
// |     |_ |       || | |   |  |   |  |   |  | ||       ||       ||       ||   |___ |   |  | |
// |_______||_______||_|  |__|  |___|  |___|  |_||_______||_______||_______||_______||___|  |_|
// Avobe this all were helper classes. This is the actual controller code!
class LiveLoopingController {
    constructor(bitwig, pressHandler, linnstrument) {
        _LiveLoopingController_instances.add(this);
        this.bitwig = bitwig;
        this.pressHandler = pressHandler;
        this.linn = linnstrument;
        // Turn off all lights
        rowIndexes.forEach((rowIndex) => {
            columnIndexes.forEach((columnIndex) => {
                this.linn.setLight({ row: rowIndex, column: columnIndex, color: "off" });
            });
        });
        // set undo button light
        this.linn.setLight({ row: 7, column: 1, color: "magenta" });
        // set redo button light
        this.linn.setLight({ row: 7, column: 2, color: "blue" });
        // Start observers
        for (let trackIndex = 0; trackIndex < 5; trackIndex++) {
            const track = bitwig.tracks.getItemAt(trackIndex);
            track.isStopped().markInterested();
            track.isActivated().markInterested();
            track.arm().addValueObserver((isArmed) => {
                this.linn.setLight({ row: 0, column: trackIndex, color: isArmed ? "magenta" : "off" });
            });
            for (let clipIndex = 0; clipIndex < 3; clipIndex++) {
                const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
                clip.isPlaying().addValueObserver((_) => {
                    __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
                clip.isRecording().addValueObserver((_) => {
                    __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
                clip.hasContent().addValueObserver((_) => {
                    __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_updateClipLight).call(this, trackIndex, track, clipIndex);
                });
            }
        }
        bitwig.transport.isClipLauncherOverdubEnabled().addValueObserver(overdubEnabled => {
            this.linn.setLight({ row: 7, column: 0, color: overdubEnabled ? "red" : "white" });
        });
        this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
        // Channel 0: Used to control bitwig
        // Channels 1-15: Used for MPE
        this.bitwig.host.getMidiInPort(0)
            .createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????")
            .setUseExpressiveMidi(true, 0, 48);
    }
    handleMidi(status, data1, data2) {
        const type = status >> 4;
        const channel = status % 16;
        // SWITCH TRACKS
        if (type === NOTE_ON && data1 === 65) {
            this.bitwig.armTrack(0);
        }
        if (type === NOTE_ON && data1 === 66) {
            this.bitwig.armTrack(1);
        }
        if (type === NOTE_ON && data1 === 67) {
            this.bitwig.armTrack(2);
        }
        if (type === NOTE_ON && data1 === 68) {
            this.bitwig.armTrack(3);
        }
        if (type === NOTE_ON && data1 === 69) {
            this.bitwig.armTrack(4);
        }
        // CLIPS
        if (type === NOTE_ON && data1 >= 50 && data1 <= 64) {
            const trackIndex = data1 % 5;
            const track = this.bitwig.tracks.getItemAt(trackIndex);
            const clipIndex = Math.floor(Math.abs(data1 - 64) / 5);
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
            this.pressHandler.handlePressBegin(onTap, onLongPress, 1000, data1);
        }
        if (type === NOTE_OFF && data1 >= 50 && data1 <= 64) {
            this.pressHandler.handlePressEnd(data1);
        }
        if (type === NOTE_ON && data1 === 30) {
            const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean();
            this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled);
        }
        if (type === NOTE_ON && data1 === 31) {
            this.bitwig.application.undo();
        }
        if (type === NOTE_ON && data1 === 32) {
            this.bitwig.application.redo();
        }
    }
}
_LiveLoopingController_instances = new WeakSet(), _LiveLoopingController_updateClipLight = function _LiveLoopingController_updateClipLight(trackIndex, track, clipIndex) {
    const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
    if (clip.isRecording().getAsBoolean()) {
        this.linn.setLight({ row: clipIndex + 1, column: trackIndex, color: "red" });
        return;
    }
    if (clip.isPlaying().getAsBoolean()) {
        this.linn.setLight({ row: clipIndex + 1, column: trackIndex, color: "blue" });
        return;
    }
    if (clip.hasContent().getAsBoolean()) {
        this.linn.setLight({ row: clipIndex + 1, column: trackIndex, color: "white" });
        return;
    }
    // Clip is empty
    this.linn.setLight({ row: clipIndex + 1, column: trackIndex, color: "off" });
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
    new LiveLoopingController(bitwig, pressHandler, linn);
    println("LinnstrumentLooping initialized!");
}
function flush() {
    // Flush any output to your controller here.
}
function exit() {
    // This gets called on exit
}
