"use strict";
loadAPI(17);
// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);
host.defineController("Roger Linn Design", "LinnstrumentLooping", "0.1", "e72dbb9b-ba1c-405e-998e-6a96dee48830", "OliverLSanz");
host.defineMidiPorts(1, 1);
let tracks;
let transport;
let scheduledTasks = new Set();
let longPressTasks = {};
if (host.platformIsWindows()) {
    // TODO: Set the correct names of the ports for auto detection on Windows platform here
    // and uncomment this when port names are correct.
    // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
else if (host.platformIsMac()) {
    // TODO: Set the correct names of the ports for auto detection on Mac OSX platform here
    // and uncomment this when port names are correct.
    // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
else if (host.platformIsLinux()) {
    // TODO: Set the correct names of the ports for auto detection on Linux platform here
    // and uncomment this when port names are correct.
    // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
function init() {
    transport = host.createTransport();
    tracks = host.createMainTrackBank(5, 0, 3);
    host.getMidiInPort(0).setMidiCallback(onMidi0);
    // Channel 0: Used to control bitwig
    // Channels 1-15: Used for MPE
    const noteIn = host.getMidiInPort(0)
        .createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????")
        .setUseExpressiveMidi(true, 0, 48);
    initLights();
    initObservers();
    println("LinnstrumentLooping initialized!");
}
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
function setLight({ row, column, color }) {
    // 20 is for select column to change color, 1 is first play column.
    midiOut({ type: CC, channel: 0, data1: 20, data2: column + 1 });
    // 21 for select row. Top is 7.
    midiOut({ type: CC, channel: 0, data1: 21, data2: Math.abs(row - 7) });
    // 22 to set color, 1 is red
    midiOut({ type: CC, channel: 0, data1: 22, data2: lightColorValues[color] });
}
function initLights() {
    setLight({ row: 1, column: 1, color: "off" });
    setLight({ row: 1, column: 2, color: "off" });
    setLight({ row: 1, column: 3, color: "off" });
    setLight({ row: 1, column: 4, color: "off" });
    setLight({ row: 1, column: 5, color: "off" });
}
function updateClipLight(trackIndex, clipIndex) {
    const track = tracks.getItemAt(trackIndex);
    const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
    if (clip.isRecording().getAsBoolean()) {
        setLight({ row: clipIndex + 1, column: trackIndex, color: "red" });
        return;
    }
    if (clip.isPlaying().getAsBoolean()) {
        setLight({ row: clipIndex + 1, column: trackIndex, color: "blue" });
        return;
    }
    if (clip.hasContent().getAsBoolean()) {
        setLight({ row: clipIndex + 1, column: trackIndex, color: "white" });
        return;
    }
    // Clip is empty
    setLight({ row: clipIndex + 1, column: trackIndex, color: "off" });
}
function initObservers() {
    for (let trackIndex = 0; trackIndex < 5; trackIndex++) {
        const track = tracks.getItemAt(trackIndex);
        track.isStopped().markInterested();
        track.isActivated().markInterested();
        track.arm().addValueObserver((isArmed) => {
            setLight({ row: 0, column: trackIndex, color: isArmed ? "magenta" : "off" });
        });
        for (let clipIndex = 0; clipIndex < 3; clipIndex++) {
            const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
            clip.isPlaying().addValueObserver((_) => {
                updateClipLight(trackIndex, clipIndex);
            });
            clip.isRecording().addValueObserver((_) => {
                updateClipLight(trackIndex, clipIndex);
            });
            clip.hasContent().addValueObserver((_) => {
                updateClipLight(trackIndex, clipIndex);
            });
        }
    }
}
function armOneTrack(trackBank, trackIndex) {
    const bankSize = trackBank.getSizeOfBank();
    for (let i = 0; i < bankSize; i++) {
        trackBank.getItemAt(i).arm().set(trackIndex === i);
    }
}
const NOTE_OFF = 8;
const NOTE_ON = 9;
const CC = 11;
function midiOut({ type, channel, data1, data2 }) {
    const status = type << 4 + channel;
    host.getMidiOutPort(0).sendMidi(status, data1, data2);
}
function scheduleTask(task, millis) {
    const taskUID = new Date().toISOString();
    scheduledTasks.add(taskUID);
    host.scheduleTask(() => {
        if (scheduledTasks.has(taskUID)) {
            task();
            scheduledTasks.delete(taskUID);
        }
    }, millis);
    return taskUID;
}
function handlePressBegin(shortPress, longPress, millis, buttonId) {
    const taskId = scheduleTask(() => {
        longPress();
        delete longPressTasks[buttonId];
    }, millis);
    longPressTasks[buttonId] = { taskId, shortPress };
}
function handlePressEnd(buttonId) {
    if (longPressTasks[buttonId] !== undefined) {
        longPressTasks[buttonId].shortPress();
        scheduledTasks.delete(longPressTasks[buttonId].taskId);
        delete longPressTasks[buttonId];
    }
}
// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0(status, data1, data2) {
    // TODO: Implement your MIDI input handling code here.
    const type = status >> 4;
    const channel = status % 16;
    // SWITCH TRACKS
    if (type === NOTE_ON && data1 === 65) {
        armOneTrack(tracks, 0);
    }
    if (type === NOTE_ON && data1 === 66) {
        armOneTrack(tracks, 1);
    }
    if (type === NOTE_ON && data1 === 67) {
        armOneTrack(tracks, 2);
    }
    if (type === NOTE_ON && data1 === 68) {
        armOneTrack(tracks, 3);
    }
    if (type === NOTE_ON && data1 === 69) {
        armOneTrack(tracks, 4);
    }
    // CLIPS
    if (type === NOTE_ON && data1 >= 50 && data1 <= 64) {
        const trackIndex = data1 % 5;
        const track = tracks.getItemAt(trackIndex);
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
        handlePressBegin(onTap, onLongPress, 1000, data1);
    }
    if (type === NOTE_OFF && data1 >= 50 && data1 <= 64) {
        handlePressEnd(data1);
    }
}
function flush() {
    // TODO: Flush any output to your controller here.
}
function exit() {
}
