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
var L;
(function (L) {
    var _ControllerModule_onUpdate, _ControllerModule_isEnabled;
    class ControllerModule {
        constructor(context) {
            _ControllerModule_onUpdate.set(this, void 0);
            _ControllerModule_isEnabled.set(this, false);
            this.bitwig = context.bitwig;
            this.pressHandler = context.pressHandler;
            this.linn = context.linnstrument;
            this.controller = context.controller;
            __classPrivateFieldSet(this, _ControllerModule_onUpdate, [], "f");
        }
        init() { }
        update() {
            if (__classPrivateFieldGet(this, _ControllerModule_isEnabled, "f")) {
                __classPrivateFieldGet(this, _ControllerModule_onUpdate, "f").forEach(callback => callback());
            }
        }
        enable() {
            __classPrivateFieldSet(this, _ControllerModule_isEnabled, true, "f");
        }
        disable() {
            __classPrivateFieldSet(this, _ControllerModule_isEnabled, false, "f");
        }
        handleMidi(midi) { return false; }
        addValueObserver(subject, callback) {
            const callbackIfEnabled = () => {
                if (__classPrivateFieldGet(this, _ControllerModule_isEnabled, "f")) {
                    callback();
                }
            };
            subject.addValueObserver(callbackIfEnabled);
            __classPrivateFieldGet(this, _ControllerModule_onUpdate, "f").push(callback);
        }
        addInitCallback(callback) {
            callback();
            __classPrivateFieldGet(this, _ControllerModule_onUpdate, "f").push(callback);
        }
    }
    _ControllerModule_onUpdate = new WeakMap(), _ControllerModule_isEnabled = new WeakMap();
    L.ControllerModule = ControllerModule;
})(L || (L = {}));
var L;
(function (L) {
    /**
     * This helper class provides functionality used by two modules
     */
    class ClipControllerModule extends L.ControllerModule {
        addClipValueObservers(numberOfTracks, firstTrackIndex, clipsPerTrack) {
            for (let trackIndex = 0; trackIndex < numberOfTracks; trackIndex++) {
                const track = this.bitwig.tracks.getItemAt(trackIndex + firstTrackIndex);
                track.arm().markInterested();
                for (let clipIndex = 0; clipIndex < clipsPerTrack; clipIndex++) {
                    const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
                    this.addValueObserver(clip.isPlaying(), () => {
                        this.updateClipLight(trackIndex, track, clipIndex);
                    });
                    this.addValueObserver(clip.isPlaying(), () => {
                        this.updateClipLight(trackIndex, track, clipIndex);
                    });
                    this.addValueObserver(clip.isRecording(), () => {
                        this.updateClipLight(trackIndex, track, clipIndex);
                    });
                    this.addValueObserver(clip.hasContent(), () => {
                        this.updateClipLight(trackIndex, track, clipIndex);
                    });
                }
            }
        }
        updateClipLight(trackIndex, track, clipIndex) { }
        getClipPressedCallbacks(trackIndex, clipIndex, firstTrackIndex, bitwig) {
            const track = bitwig.tracks.getItemAt(trackIndex + firstTrackIndex);
            const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
            function onTap() {
                if (!clip.hasContent().getAsBoolean() && !track.arm().get()) {
                    bitwig.armTrack(trackIndex + firstTrackIndex);
                }
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
            return [onTap, onLongPress];
        }
    }
    L.ClipControllerModule = ClipControllerModule;
})(L || (L = {}));
var L;
(function (L) {
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
            this.tracks = host.createMainTrackBank(15, 0, 8);
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
    L.Bitwig = Bitwig;
})(L || (L = {}));
//  _______  _______  __    _  _______  ______    _______  ___      ___      _______  ______
// |       ||       ||  |  | ||       ||    _ |  |       ||   |    |   |    |       ||    _ |
// |       ||   _   ||   |_| ||_     _||   | ||  |   _   ||   |    |   |    |    ___||   | ||
// |       ||  | |  ||       |  |   |  |   |_||_ |  | |  ||   |    |   |    |   |___ |   |_||_
// |      _||  |_|  ||  _    |  |   |  |    __  ||  |_|  ||   |___ |   |___ |    ___||    __  |
// |     |_ |       || | |   |  |   |  |   |  | ||       ||       ||       ||   |___ |   |  | |
// |_______||_______||_|  |__|  |___|  |___|  |_||_______||_______||_______||_______||___|  |_|
var L;
(function (L) {
    var _LiveLoopingController_instances, _LiveLoopingController_keyTranslationTable, _LiveLoopingController_noteInput, _LiveLoopingController_currentMode, _LiveLoopingController_linn, _LiveLoopingController_modules, _LiveLoopingController_options, _LiveLoopingController_width, _LiveLoopingController_height, _LiveLoopingController_noteOffset, _LiveLoopingController_rowOffset, _LiveLoopingController_noteColors, _LiveLoopingController_firstControlAreaButton, _LiveLoopingController_setupBitwigPreferencesPannel, _LiveLoopingController_configureLinnstrument, _LiveLoopingController_getPlayAreaWidth, _LiveLoopingController_getLeftSplitWidth, _LiveLoopingController_buttonToNote, _LiveLoopingController_setPlayAreaLights, _LiveLoopingController_updateKeyTranslationTable, _LiveLoopingController_update;
    class LiveLoopingController {
        constructor(bitwig, pressHandler, linnstrument, options) {
            _LiveLoopingController_instances.add(this);
            _LiveLoopingController_keyTranslationTable.set(this, void 0);
            _LiveLoopingController_noteInput.set(this, void 0);
            _LiveLoopingController_currentMode.set(this, "default");
            this.ccSlidersEnabled = false;
            this.slidersMode = "soft";
            _LiveLoopingController_linn.set(this, void 0);
            _LiveLoopingController_modules.set(this, void 0);
            _LiveLoopingController_options.set(this, void 0);
            _LiveLoopingController_width.set(this, 16);
            _LiveLoopingController_height.set(this, 8);
            _LiveLoopingController_noteOffset.set(this, 30); // note played by the lowest key in the play area
            _LiveLoopingController_rowOffset.set(this, 6); // distance in semitomes while going 1 row up
            _LiveLoopingController_noteColors.set(this, ['orange', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off']);
            _LiveLoopingController_firstControlAreaButton.set(this, 0);
            this.bitwig = bitwig;
            this.pressHandler = pressHandler;
            __classPrivateFieldSet(this, _LiveLoopingController_linn, linnstrument, "f");
            this.linn = linnstrument;
            __classPrivateFieldSet(this, _LiveLoopingController_options, options, "f");
            __classPrivateFieldSet(this, _LiveLoopingController_modules, { default: [] }, "f");
            __classPrivateFieldSet(this, _LiveLoopingController_keyTranslationTable, [], "f");
            __classPrivateFieldSet(this, _LiveLoopingController_noteInput, this.bitwig.host.getMidiInPort(0).createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????"), "f");
            __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setUseExpressiveMidi(true, 0, 24);
            // Configure CC sliders to control remote control page of selected device
            const cursorTrack = host.createCursorTrack("LINNSTRUMENT_CURSOR_TRACK", "Cursor Track", 0, 0, true);
            const cursorDevice = cursorTrack.createCursorDevice();
            const remoteControlsPage = cursorDevice.createCursorRemoteControlsPage(8);
            const hardwareSurface = bitwig.host.createHardwareSurface();
            for (let i = 0; i < remoteControlsPage.getParameterCount(); i++) {
                remoteControlsPage.getParameter(i).setIndication(true);
                const knob = hardwareSurface.createAbsoluteHardwareKnob("knob" + i);
                const absoluteCCValueMatcher = this.bitwig.host.getMidiInPort(0).createAbsoluteCCValueMatcher(0, 8 - i);
                knob.setAdjustValueMatcher(absoluteCCValueMatcher);
                knob.disableTakeOver();
                remoteControlsPage.getParameter(i).addBinding(knob);
            }
        }
        addModules(mode, modules) {
            if (__classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[mode] === undefined) {
                __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[mode] = [];
            }
            __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[mode] = __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[mode].concat(modules);
        }
        start() {
            __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_setupBitwigPreferencesPannel).call(this);
            this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
            this.bitwig.host.getMidiInPort(0);
            __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_configureLinnstrument).call(this);
            __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")["default"].forEach(module => module.enable());
            Object.keys(__classPrivateFieldGet(this, _LiveLoopingController_modules, "f")).forEach(mode => {
                __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[mode].forEach(module => {
                    module.init();
                });
            });
            __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
        }
        coordinateToControlSplitButton({ row, column }) {
            return __classPrivateFieldGet(this, _LiveLoopingController_firstControlAreaButton, "f") + (7 - row) * __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) + column;
        }
        controlSplitButtonToCoordinate(button) {
            const row = 7 - Math.floor((button - __classPrivateFieldGet(this, _LiveLoopingController_firstControlAreaButton, "f")) / __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this));
            const column = button % __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this);
            return { row, column };
        }
        setButtonLight(button, color, force) {
            const buttonOffset = 0; // number of the first button
            const buttonsPerRow = 16;
            const row = Math.floor((button - buttonOffset) / buttonsPerRow);
            const column = button - row * buttonsPerRow;
            this.setLight({ row: 7 - row, column: column, color, force });
        }
        handleMidi(status, data1, data2) {
            const type = status >> 4;
            const channel = status % 16;
            // Pass the midi message to each module.handleMidi until one returns true
            __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[__classPrivateFieldGet(this, _LiveLoopingController_currentMode, "f")].some(module => module.handleMidi({ type, channel, data1, data2 }));
        }
        isInterfaceButton(buttonIndex) {
            const interfaceWidth = __classPrivateFieldGet(this, _LiveLoopingController_options, "f").interfaceWidth;
            if (__classPrivateFieldGet(this, _LiveLoopingController_currentMode, "f") === "default") {
                return buttonIndex % __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) < interfaceWidth;
            }
            else {
                return buttonIndex % __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) < 1;
            }
        }
        getMode() {
            return __classPrivateFieldGet(this, _LiveLoopingController_currentMode, "f");
        }
        setMode(mode) {
            __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[this.getMode()].forEach(module => module.disable());
            __classPrivateFieldSet(this, _LiveLoopingController_currentMode, mode, "f");
            __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[this.getMode()].forEach(module => module.enable());
            __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
        }
        toggleCCSliders() {
            this.ccSlidersEnabled = !this.ccSlidersEnabled;
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSelectedSplit("right");
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitActive(this.ccSlidersEnabled);
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitPoint(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getLeftSplitWidth).call(this) + 1);
            __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
        }
        setSlidersMode(mode) {
            this.slidersMode = mode;
            for (let i = 0; i < 8; i++) {
                __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setCCFaderNumber(i, (mode == "soft" ? 0 : 8) + i + 1, 'left');
            }
            __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
        }
        setLight(options) {
            const linnOptions = {
                row: options.row,
                column: options.column + (options.absolute ? 0 : __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getLeftSplitWidth).call(this)),
                color: options.color
            };
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setLight(linnOptions);
        }
    }
    _LiveLoopingController_keyTranslationTable = new WeakMap(), _LiveLoopingController_noteInput = new WeakMap(), _LiveLoopingController_currentMode = new WeakMap(), _LiveLoopingController_linn = new WeakMap(), _LiveLoopingController_modules = new WeakMap(), _LiveLoopingController_options = new WeakMap(), _LiveLoopingController_width = new WeakMap(), _LiveLoopingController_height = new WeakMap(), _LiveLoopingController_noteOffset = new WeakMap(), _LiveLoopingController_rowOffset = new WeakMap(), _LiveLoopingController_noteColors = new WeakMap(), _LiveLoopingController_firstControlAreaButton = new WeakMap(), _LiveLoopingController_instances = new WeakSet(), _LiveLoopingController_setupBitwigPreferencesPannel = function _LiveLoopingController_setupBitwigPreferencesPannel() {
        const preferences = this.bitwig.host.getPreferences();
        const rowOffsetSettings = {
            '+3': 3,
            '+4': 4,
            '+5': 5,
            '+6': 6,
            '+7': 7,
            'OCTAVE': 8
        };
        preferences.getEnumSetting('Row Offset', 'Row Offset', Object.keys(rowOffsetSettings), '+5').addValueObserver(chosenOption => {
            var _a, _b;
            if ((_a = __classPrivateFieldGet(this, _LiveLoopingController_rowOffset, "f") !== rowOffsetSettings[chosenOption]) !== null && _a !== void 0 ? _a : 5) {
                __classPrivateFieldSet(this, _LiveLoopingController_rowOffset, (_b = rowOffsetSettings[chosenOption]) !== null && _b !== void 0 ? _b : 5, "f");
                __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
            }
        });
        const noteIndexes = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
        };
        for (const noteName in noteIndexes) {
            preferences.getEnumSetting(noteName, 'Note Colors', Object.keys(L.lightColorValues), noteIndexes[noteName] == 0 ? 'orange' : 'off').addValueObserver(chosenColor => {
                if (__classPrivateFieldGet(this, _LiveLoopingController_noteColors, "f")[noteIndexes[noteName]] !== chosenColor) {
                    __classPrivateFieldGet(this, _LiveLoopingController_noteColors, "f")[noteIndexes[noteName]] = chosenColor;
                    __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_update).call(this);
                }
            });
        }
    }, _LiveLoopingController_configureLinnstrument = function _LiveLoopingController_configureLinnstrument() {
        // Global settings
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setRowOffset(0);
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setTransposition(3, 1);
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSelectedSplit("right");
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitActive(this.ccSlidersEnabled);
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitPoint(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getLeftSplitWidth).call(this) + 1);
        // Left split
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiBendRange(24, 'left');
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiMode("OneChannel", 'left');
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiMainChannel(0, 'left');
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitMode('left', 'faders');
        for (let i = 0; i < 8; i++) {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setCCFaderNumber(i, i + 1, 'left');
        }
        // Right split
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiBendRange(24, 'right');
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiMode("ChannelPerNote", 'right');
        __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setSplitMode('right', 'default');
        Array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15).forEach(i => {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setMidiPerNoteChannel(i, true, 'right');
        });
    }, _LiveLoopingController_getPlayAreaWidth = function _LiveLoopingController_getPlayAreaWidth() {
        return __classPrivateFieldGet(this, _LiveLoopingController_width, "f") - __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getLeftSplitWidth).call(this);
    }, _LiveLoopingController_getLeftSplitWidth = function _LiveLoopingController_getLeftSplitWidth() {
        return this.ccSlidersEnabled ? __classPrivateFieldGet(this, _LiveLoopingController_options, "f").ccSlidersWidth : 0;
    }, _LiveLoopingController_buttonToNote = function _LiveLoopingController_buttonToNote(buttonIndex) {
        // This ensures the same notes are played by the same buttons
        // regardless of the interface state
        const interfaceOffset = __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getLeftSplitWidth).call(this);
        const rowDecrement = __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) - __classPrivateFieldGet(this, _LiveLoopingController_rowOffset, "f");
        const currentRow = Math.floor((buttonIndex) / __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this));
        const rowAdjustment = currentRow * rowDecrement;
        const note = buttonIndex - rowAdjustment + __classPrivateFieldGet(this, _LiveLoopingController_noteOffset, "f") + interfaceOffset;
        return note;
    }, _LiveLoopingController_setPlayAreaLights = function _LiveLoopingController_setPlayAreaLights() {
        for (let row = 0; row < __classPrivateFieldGet(this, _LiveLoopingController_height, "f"); row++) {
            for (let column = 0; column < __classPrivateFieldGet(this, _LiveLoopingController_width, "f"); column++) {
                if (column >= 0) {
                    const playAreaButton = row * __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_getPlayAreaWidth).call(this) + column;
                    const note = __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, playAreaButton) % 12;
                    const color = __classPrivateFieldGet(this, _LiveLoopingController_noteColors, "f")[note];
                    this.setLight({ row: 7 - row, column: column, color, force: true });
                }
                else {
                    this.setLight({ row: 7 - row, column: column, color: "off", force: true });
                }
            }
        }
    }, _LiveLoopingController_updateKeyTranslationTable = function _LiveLoopingController_updateKeyTranslationTable() {
        const newTranslationTable = [];
        for (let key = 0; key <= L.MAX_MIDI_NOTE; key++) {
            if (this.isInterfaceButton(key)) {
                newTranslationTable.push(-1);
            }
            else {
                newTranslationTable.push(__classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_buttonToNote).call(this, key));
            }
        }
        __classPrivateFieldSet(this, _LiveLoopingController_keyTranslationTable, newTranslationTable, "f");
        __classPrivateFieldGet(this, _LiveLoopingController_noteInput, "f").setKeyTranslationTable(__classPrivateFieldGet(this, _LiveLoopingController_keyTranslationTable, "f"));
    }, _LiveLoopingController_update = function _LiveLoopingController_update() {
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_updateKeyTranslationTable).call(this);
        if (__classPrivateFieldGet(this, _LiveLoopingController_currentMode, "f") == "default") {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").turnOffLights();
        }
        else {
            __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").resetLights();
        }
        __classPrivateFieldGet(this, _LiveLoopingController_instances, "m", _LiveLoopingController_setPlayAreaLights).call(this);
        __classPrivateFieldGet(this, _LiveLoopingController_modules, "f")[__classPrivateFieldGet(this, _LiveLoopingController_currentMode, "f")].forEach(module => module.update());
        // Color the CC sliders matching bitwig remote control page
        // knob colors.
        if (this.ccSlidersEnabled) {
            const softColors = ['red', 'orange', 'yellow', 'green', 'lime', 'cyan', 'pink', 'magenta'];
            const hardColors = ['white', 'cyan', 'white', 'cyan', 'white', 'cyan', 'white', 'cyan'];
            const sliderColors = {
                'soft': softColors,
                'hard': hardColors
            };
            for (let i = 0; i < 8; i++) {
                __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setLight({ row: i, column: 0, color: sliderColors[this.slidersMode][i] });
                __classPrivateFieldGet(this, _LiveLoopingController_linn, "f").setLight({ row: i, column: 1, color: sliderColors[this.slidersMode][i] });
            }
        }
    };
    L.LiveLoopingController = LiveLoopingController;
})(L || (L = {}));
var L;
(function (L) {
    //  _ _                 _                                   _
    // | (_)               | |                                 | |
    // | |_ _ __  _ __  ___| |_ _ __ _   _ _ __ ___   ___ _ __ | |_
    // | | | '_ \| '_ \/ __| __| '__| | | | '_ ` _ \ / _ \ '_ \| __|
    // | | | | | | | | \__ \ |_| |  | |_| | | | | | |  __/ | | | |
    // |_|_|_| |_|_| |_|___/\__|_|   \__,_|_| |_| |_|\___|_| |_|\__|
    var _LinnStrument_bitwig;
    class LinnStrument {
        constructor(bitwig) {
            _LinnStrument_bitwig.set(this, void 0);
            __classPrivateFieldSet(this, _LinnStrument_bitwig, bitwig, "f");
        }
        setLight({ row, column, color }) {
            // 20 is for select column to change color, 1 is first play column.
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 20, data2: column + 1 });
            // 21 for select row. Top is 7.
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 21, data2: Math.abs(row - 7) });
            // 22 to set color, 1 is red
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 22, data2: L.lightColorValues[color] });
        }
        resetLights() {
            L.rowIndexes.forEach(row => {
                L.columnIndexes.forEach(column => {
                    this.setLight({ row, column, color: "default" });
                });
            });
        }
        turnOffLights() {
            L.rowIndexes.forEach(row => {
                L.columnIndexes.forEach(column => {
                    this.setLight({ row, column, color: "off" });
                });
            });
        }
        sendNRPN(number, value) {
            const MSBNumber = number >> 7;
            const LSBNumber = number % 128;
            const MSBValue = value >> 7;
            const LSBValue = value % 128;
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 99, data2: MSBNumber });
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 98, data2: LSBNumber });
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 6, data2: MSBValue });
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 38, data2: LSBValue });
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 101, data2: 127 });
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 100, data2: 127 });
            L.sleep(50);
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
        setSplitMode(split, mode) {
            const values = {
                "default": 0,
                "arpeg": 1,
                "faders": 2,
                "strum": 3,
                "sequencer": 4
            };
            this.sendNRPN(split == "left" ? 35 : 135, values[mode]);
        }
        /**
         *
         * @param fader Index of the CC fader, from 0 to 7.
         * @param ccNumber CC number that the fader should send when used.
         */
        setCCFaderNumber(fader, ccNumber, split) {
            this.sendNRPN((split == 'left' ? 40 : 140) + fader, ccNumber);
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
        /**
         *
         * @param fader Index of the CC fader, from 0 to 7.
         * @param value
         */
        setCCFaderValue(fader, value) {
            __classPrivateFieldGet(this, _LinnStrument_bitwig, "f").midiOut({ type: L.CC, channel: 0, data1: 1 + fader, data2: value });
        }
    }
    _LinnStrument_bitwig = new WeakMap();
    L.LinnStrument = LinnStrument;
})(L || (L = {}));
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
    const taskManager = new L.TaskManager(host);
    const pressHandler = new L.PressHandler(taskManager);
    const bitwig = new L.Bitwig(host);
    const linn = new L.LinnStrument(bitwig);
    const controllerOptions = {
        ccSlidersWidth: 2,
        interfaceWidth: 5,
    };
    const controller = new L.LiveLoopingController(bitwig, pressHandler, linn, controllerOptions);
    const context = {
        bitwig: bitwig,
        pressHandler: pressHandler,
        linnstrument: linn,
        controller: controller
    };
    const defaultModules = [
        // new Debug(context),
        new L.TracksRow(context, { row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5, armedTrackColor: "magenta", unarmedTrackColor: "off" }),
        new L.ClipArray(context, { row: 1, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: 'red', playingColor: "orange", pausedColor: "white", emptyColor: "blue" }),
        new L.LoopLength(context, { row: 6, column: 0, offColor: 'off', onColor: 'orange' }),
        // low-light option
        // new ClipArray(context, {row: 1, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: "red", playingColor: "blue", pausedColor: "white", emptyColor: "off"}),
        // new LoopLength(context, {row: 6, column: 0, offColor: 'off', onColor: 'blue'}),
        new L.UndoRedo(context, { row: 7, column: 2, color: 'magenta' }),
        new L.OverdubToggle(context, { row: 7, column: 0, offColor: 'white', onColor: 'red' }),
        new L.InterfaceToggle(context, { row: 7, column: 4, color: "yellow" }),
        new L.CCFadersToggle(context, { row: 7, column: 3, ccFadersWidth: 2, lowerCC: 1, color: 'green' }),
        new L.Metronome(context, { row: 7, column: 1, onColor: 'orange', offColor: 'white' }),
        new L.ClipArray(context, { row: 5, column: 0, firstTrackIndex: 5, numberOfTracks: 5, clipsPerTrack: 1, recordingColor: "red", playingColor: "green", pausedColor: "white", emptyColor: "cyan" })
        // new ClipArray(context, {row: 5, column: 0, firstTrackIndex: 5, numberOfTracks: 5, clipsPerTrack: 1, recordingColor: "red", playingColor: "blue", pausedColor: "white", emptyColor: "off"})
    ];
    const collapsedInterfaceModules = [
        // new Debug(context),
        new L.FollowerClipColumn(context, { row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: 'red', playingColor: "orange", pausedColor: "white", emptyColor: "blue" }),
        // new FollowerClipColumn(context, {row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: "red", playingColor: "blue", pausedColor: "white", emptyColor: "off" }),
        new L.OverdubToggle(context, { row: 4, column: 0, offColor: 'white', onColor: 'red' }),
        new L.UndoRedo(context, { row: 5, column: 0, color: "magenta" }),
        new L.CCFadersToggle(context, { row: 6, column: 0, ccFadersWidth: 2, lowerCC: 1, color: 'green' }),
        new L.InterfaceToggle(context, { row: 7, column: 0, color: "yellow" }),
    ];
    controller.addModules("default", defaultModules);
    controller.addModules("collapsedInterface", collapsedInterfaceModules);
    controller.start();
    println("LinnstrumentLooping initialized!");
}
function flush() {
    // Flush any output to your controller here.
}
function exit() {
    // This gets called on exit
}
//  __                              __,-,__                           __
// |  |_.--.--.-----.-----.-----.  |  ' '__|  .----.-----.-----.-----|  |_.-----.
// |   _|  |  |  _  |  -__|__ --|  |     __|  |  __|  _  |     |__ --|   _|__ --|
// |____|___  |   __|_____|_____|  |_______|  |____|_____|__|__|_____|____|_____|
//      |_____|__|                    |_|
var L;
(function (L) {
    L.lightColorValues = {
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
    L.rowIndexes = [0, 1, 2, 3, 4, 5, 6, 7];
    L.columnIndexes = [0, 1, 2, 3, 4];
    L.NOTE_OFF = 8;
    L.NOTE_ON = 9;
    L.CC = 11;
    L.MAX_MIDI_NOTE = 127;
})(L || (L = {}));
var L;
(function (L) {
    var _CCFadersToggle_instances, _CCFadersToggle_options, _CCFadersToggle_onTap, _CCFadersToggle_onLongPress;
    class CCFadersToggle extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _CCFadersToggle_instances.add(this);
            _CCFadersToggle_options.set(this, void 0);
            __classPrivateFieldSet(this, _CCFadersToggle_options, options, "f");
        }
        init() {
            this.addInitCallback(() => {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _CCFadersToggle_options, "f").row, column: __classPrivateFieldGet(this, _CCFadersToggle_options, "f").column, color: __classPrivateFieldGet(this, _CCFadersToggle_options, "f").color });
            });
        }
        handleMidi(midi) {
            const button = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _CCFadersToggle_options, "f").row, column: __classPrivateFieldGet(this, _CCFadersToggle_options, "f").column });
            if (midi.type === L.NOTE_ON && midi.data1 === button) {
                this.pressHandler.handlePressBegin(() => __classPrivateFieldGet(this, _CCFadersToggle_instances, "m", _CCFadersToggle_onTap).call(this), () => __classPrivateFieldGet(this, _CCFadersToggle_instances, "m", _CCFadersToggle_onLongPress).call(this), midi.data1);
                return true;
            }
            if (midi.type === L.NOTE_OFF && midi.data1 === button) {
                this.pressHandler.handlePressEnd(midi.data1);
                return true;
            }
            return false;
        }
    }
    _CCFadersToggle_options = new WeakMap(), _CCFadersToggle_instances = new WeakSet(), _CCFadersToggle_onTap = function _CCFadersToggle_onTap() {
        this.controller.toggleCCSliders();
    }, _CCFadersToggle_onLongPress = function _CCFadersToggle_onLongPress() {
        this.controller.setSlidersMode(this.controller.slidersMode == 'hard' ? 'soft' : 'hard');
    };
    L.CCFadersToggle = CCFadersToggle;
})(L || (L = {}));
var L;
(function (L) {
    var _ClipArray_options;
    class ClipArray extends L.ClipControllerModule {
        constructor(context, options) {
            super(context);
            _ClipArray_options.set(this, void 0);
            __classPrivateFieldSet(this, _ClipArray_options, options, "f");
        }
        init() {
            // Start observers
            this.addClipValueObservers(__classPrivateFieldGet(this, _ClipArray_options, "f").numberOfTracks, __classPrivateFieldGet(this, _ClipArray_options, "f").firstTrackIndex, __classPrivateFieldGet(this, _ClipArray_options, "f").clipsPerTrack);
        }
        handleMidi(midi) {
            const { row, column } = this.controller.controlSplitButtonToCoordinate(midi.data1);
            if (row >= __classPrivateFieldGet(this, _ClipArray_options, "f").row && row < __classPrivateFieldGet(this, _ClipArray_options, "f").row + __classPrivateFieldGet(this, _ClipArray_options, "f").clipsPerTrack
                && column >= __classPrivateFieldGet(this, _ClipArray_options, "f").column && column < __classPrivateFieldGet(this, _ClipArray_options, "f").column + __classPrivateFieldGet(this, _ClipArray_options, "f").numberOfTracks) {
                if (midi.type === L.NOTE_ON) {
                    const trackIndex = column - __classPrivateFieldGet(this, _ClipArray_options, "f").column;
                    const clipIndex = row - __classPrivateFieldGet(this, _ClipArray_options, "f").row;
                    const [onTap, onLongPress] = this.getClipPressedCallbacks(trackIndex, clipIndex, __classPrivateFieldGet(this, _ClipArray_options, "f").firstTrackIndex, this.bitwig);
                    this.pressHandler.handlePressBegin(onTap, onLongPress, midi.data1);
                }
                if (midi.type === L.NOTE_OFF) {
                    this.pressHandler.handlePressEnd(midi.data1);
                }
                return true;
            }
            return false;
        }
        updateClipLight(trackIndex, track, clipIndex) {
            const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
            if (clip.isRecording().getAsBoolean()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _ClipArray_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _ClipArray_options, "f").column + trackIndex, color: __classPrivateFieldGet(this, _ClipArray_options, "f").recordingColor });
                return;
            }
            if (clip.isPlaying().getAsBoolean()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _ClipArray_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _ClipArray_options, "f").column + trackIndex, color: __classPrivateFieldGet(this, _ClipArray_options, "f").playingColor });
                return;
            }
            if (clip.hasContent().getAsBoolean()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _ClipArray_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _ClipArray_options, "f").column + trackIndex, color: __classPrivateFieldGet(this, _ClipArray_options, "f").pausedColor });
                return;
            }
            // Clip is empty
            this.controller.setLight({ row: __classPrivateFieldGet(this, _ClipArray_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _ClipArray_options, "f").column + trackIndex, color: __classPrivateFieldGet(this, _ClipArray_options, "f").emptyColor });
        }
    }
    _ClipArray_options = new WeakMap();
    L.ClipArray = ClipArray;
})(L || (L = {}));
var L;
(function (L) {
    class Debug extends L.ControllerModule {
        init() {
        }
        handleMidi(midi) {
            let message = "";
            const Y_CC = 74;
            if (midi.type == L.NOTE_ON) {
                message += "   NOTE ON ";
            }
            else if (midi.type == L.NOTE_OFF) {
                message += "  NOTE OFF ";
            }
            else if (midi.type == L.CC && midi.data1 == Y_CC) {
                message += "      Y CC ";
            }
            else if (midi.type == L.CC) {
                message += "        CC ";
            }
            else {
                message += "           ";
            }
            message += `CH ${midi.channel} TY ${midi.type} D1 ${midi.data1} D2 ${midi.data2}`;
            println(message);
            return false;
        }
    }
    L.Debug = Debug;
})(L || (L = {}));
var L;
(function (L) {
    var _FollowerClipColumn_options, _FollowerClipColumn_currentTrackIndex;
    class FollowerClipColumn extends L.ClipControllerModule {
        constructor(context, options) {
            super(context);
            _FollowerClipColumn_options.set(this, void 0);
            _FollowerClipColumn_currentTrackIndex.set(this, 0);
            __classPrivateFieldSet(this, _FollowerClipColumn_options, options, "f");
        }
        init() {
            for (let trackIndex = 0; trackIndex < __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").numberOfTracks; trackIndex++) {
                const track = this.bitwig.tracks.getItemAt(trackIndex + __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").firstTrackIndex);
                this.addValueObserver(track.arm(), () => {
                    const isArmed = track.arm().get();
                    if (isArmed) {
                        __classPrivateFieldSet(this, _FollowerClipColumn_currentTrackIndex, trackIndex, "f");
                        for (let clipIndex = 0; clipIndex < __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").clipsPerTrack; clipIndex++) {
                            this.updateClipLight(trackIndex, track, clipIndex);
                        }
                    }
                });
            }
            this.addClipValueObservers(__classPrivateFieldGet(this, _FollowerClipColumn_options, "f").numberOfTracks, __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").firstTrackIndex, __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").clipsPerTrack);
        }
        handleMidi(midi) {
            const { row, column } = this.controller.controlSplitButtonToCoordinate(midi.data1);
            if (row >= __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row && row < __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row + __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").clipsPerTrack
                && column == __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").column) {
                if (midi.type === L.NOTE_ON) {
                    const trackIndex = __classPrivateFieldGet(this, _FollowerClipColumn_currentTrackIndex, "f");
                    const clipIndex = row - __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row;
                    const [onTap, onLongPress] = this.getClipPressedCallbacks(trackIndex, clipIndex, __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").firstTrackIndex, this.bitwig);
                    this.pressHandler.handlePressBegin(onTap, onLongPress, midi.data1);
                }
                if (midi.type === L.NOTE_OFF) {
                    this.pressHandler.handlePressEnd(midi.data1);
                }
                return true;
            }
            return false;
        }
        updateClipLight(trackIndex, track, clipIndex) {
            const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);
            if (__classPrivateFieldGet(this, _FollowerClipColumn_currentTrackIndex, "f") !== trackIndex) {
                return;
            }
            if (clip.isRecording().getAsBoolean()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").column, color: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").recordingColor });
                return;
            }
            if (clip.isPlaying().getAsBoolean()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").column, color: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").playingColor });
                return;
            }
            if (clip.hasContent().getAsBoolean()) {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").column, color: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").pausedColor });
                return;
            }
            // Clip is empty
            this.controller.setLight({ row: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").row + clipIndex, column: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").column, color: __classPrivateFieldGet(this, _FollowerClipColumn_options, "f").emptyColor });
        }
    }
    _FollowerClipColumn_options = new WeakMap(), _FollowerClipColumn_currentTrackIndex = new WeakMap();
    L.FollowerClipColumn = FollowerClipColumn;
})(L || (L = {}));
var L;
(function (L) {
    var _InterfaceToggle_options;
    class InterfaceToggle extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _InterfaceToggle_options.set(this, void 0);
            __classPrivateFieldSet(this, _InterfaceToggle_options, options, "f");
        }
        init() {
            this.addInitCallback(() => {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _InterfaceToggle_options, "f").row, column: __classPrivateFieldGet(this, _InterfaceToggle_options, "f").column, color: __classPrivateFieldGet(this, _InterfaceToggle_options, "f").color, force: true });
            });
        }
        handleMidi(midi) {
            const button = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _InterfaceToggle_options, "f").row, column: __classPrivateFieldGet(this, _InterfaceToggle_options, "f").column });
            if (midi.type === L.NOTE_ON && midi.data1 === button) {
                if (this.controller.getMode() === "default") {
                    this.controller.setMode("collapsedInterface");
                }
                else {
                    this.controller.setMode("default");
                }
                return true;
            }
            return false;
        }
    }
    _InterfaceToggle_options = new WeakMap();
    L.InterfaceToggle = InterfaceToggle;
})(L || (L = {}));
var L;
(function (L) {
    var _LoopLength_options, _LoopLength_bars, _LoopLength_nextBars, _LoopLength_pressedButtons;
    class LoopLength extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _LoopLength_options.set(this, void 0);
            _LoopLength_bars.set(this, 0);
            _LoopLength_nextBars.set(this, 0);
            _LoopLength_pressedButtons.set(this, [false, false, false, false, false]);
            __classPrivateFieldSet(this, _LoopLength_options, options, "f");
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
            this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_options, "f").row, column: __classPrivateFieldGet(this, _LoopLength_options, "f").column, color: light1 ? __classPrivateFieldGet(this, _LoopLength_options, "f").onColor : __classPrivateFieldGet(this, _LoopLength_options, "f").offColor });
            this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_options, "f").row, column: __classPrivateFieldGet(this, _LoopLength_options, "f").column + 1, color: light2 ? __classPrivateFieldGet(this, _LoopLength_options, "f").onColor : __classPrivateFieldGet(this, _LoopLength_options, "f").offColor });
            this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_options, "f").row, column: __classPrivateFieldGet(this, _LoopLength_options, "f").column + 2, color: light3 ? __classPrivateFieldGet(this, _LoopLength_options, "f").onColor : __classPrivateFieldGet(this, _LoopLength_options, "f").offColor });
            this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_options, "f").row, column: __classPrivateFieldGet(this, _LoopLength_options, "f").column + 3, color: light4 ? __classPrivateFieldGet(this, _LoopLength_options, "f").onColor : __classPrivateFieldGet(this, _LoopLength_options, "f").offColor });
            this.controller.setLight({ row: __classPrivateFieldGet(this, _LoopLength_options, "f").row, column: __classPrivateFieldGet(this, _LoopLength_options, "f").column + 4, color: light5 ? __classPrivateFieldGet(this, _LoopLength_options, "f").onColor : __classPrivateFieldGet(this, _LoopLength_options, "f").offColor });
        }
        handleMidi(midi) {
            const baseNote = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _LoopLength_options, "f").row, column: __classPrivateFieldGet(this, _LoopLength_options, "f").column });
            const receivedNote = midi.data1;
            const button = receivedNote - baseNote;
            if (button < 0 || button > 4) {
                return false;
            }
            if (midi.type === L.NOTE_OFF) {
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
            if (midi.type === L.NOTE_ON) {
                __classPrivateFieldGet(this, _LoopLength_pressedButtons, "f")[button] = true;
                __classPrivateFieldSet(this, _LoopLength_nextBars, __classPrivateFieldGet(this, _LoopLength_nextBars, "f") + (1 << button), "f");
                return true;
            }
            return false;
        }
    }
    _LoopLength_options = new WeakMap(), _LoopLength_bars = new WeakMap(), _LoopLength_nextBars = new WeakMap(), _LoopLength_pressedButtons = new WeakMap();
    L.LoopLength = LoopLength;
})(L || (L = {}));
var L;
(function (L) {
    var _Metronome_instances, _Metronome_options, _Metronome_onTap, _Metronome_onLongPress;
    class Metronome extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _Metronome_instances.add(this);
            _Metronome_options.set(this, void 0);
            __classPrivateFieldSet(this, _Metronome_options, options, "f");
        }
        init() {
            this.addValueObserver(this.bitwig.transport.isMetronomeEnabled(), () => {
                const metronomeEnabled = this.bitwig.transport.isMetronomeEnabled().get();
                this.controller.setLight({ row: __classPrivateFieldGet(this, _Metronome_options, "f").row, column: __classPrivateFieldGet(this, _Metronome_options, "f").column, color: metronomeEnabled ? __classPrivateFieldGet(this, _Metronome_options, "f").onColor : __classPrivateFieldGet(this, _Metronome_options, "f").offColor });
            });
        }
        handleMidi(midi) {
            const button = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _Metronome_options, "f").row, column: __classPrivateFieldGet(this, _Metronome_options, "f").column });
            if (midi.type === L.NOTE_ON && midi.data1 === button) {
                this.pressHandler.handlePressBegin(() => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onTap).call(this), () => __classPrivateFieldGet(this, _Metronome_instances, "m", _Metronome_onLongPress).call(this), midi.data1);
                return true;
            }
            if (midi.type === L.NOTE_OFF && midi.data1 === button) {
                this.pressHandler.handlePressEnd(midi.data1);
                return true;
            }
            return false;
        }
    }
    _Metronome_options = new WeakMap(), _Metronome_instances = new WeakSet(), _Metronome_onTap = function _Metronome_onTap() {
        this.bitwig.transport.tapTempo();
    }, _Metronome_onLongPress = function _Metronome_onLongPress() {
        this.bitwig.transport.isMetronomeEnabled().toggle();
    };
    L.Metronome = Metronome;
})(L || (L = {}));
var L;
(function (L) {
    var _OverdubToggle_options;
    class OverdubToggle extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _OverdubToggle_options.set(this, void 0);
            __classPrivateFieldSet(this, _OverdubToggle_options, options, "f");
        }
        init() {
            this.addValueObserver(this.bitwig.transport.isClipLauncherOverdubEnabled(), () => {
                const isOverdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().get();
                this.controller.setLight({ row: __classPrivateFieldGet(this, _OverdubToggle_options, "f").row, column: __classPrivateFieldGet(this, _OverdubToggle_options, "f").column, color: isOverdubEnabled ? __classPrivateFieldGet(this, _OverdubToggle_options, "f").onColor : __classPrivateFieldGet(this, _OverdubToggle_options, "f").offColor });
            });
        }
        handleMidi(midi) {
            const buttonNote = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _OverdubToggle_options, "f").row, column: __classPrivateFieldGet(this, _OverdubToggle_options, "f").column });
            if (midi.type === L.NOTE_ON && midi.data1 === buttonNote) {
                const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean();
                this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled);
                return true;
            }
            return false;
        }
    }
    _OverdubToggle_options = new WeakMap();
    L.OverdubToggle = OverdubToggle;
})(L || (L = {}));
var L;
(function (L) {
    var _TracksRow_options;
    class TracksRow extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _TracksRow_options.set(this, void 0);
            __classPrivateFieldSet(this, _TracksRow_options, options, "f");
        }
        init() {
            for (let trackIndex = 0; trackIndex < __classPrivateFieldGet(this, _TracksRow_options, "f").numberOfTracks; trackIndex++) {
                const track = this.bitwig.tracks.getItemAt(trackIndex + __classPrivateFieldGet(this, _TracksRow_options, "f").firstTrackIndex);
                this.addValueObserver(track.arm(), () => {
                    const isArmed = track.arm().get();
                    this.controller.setLight({
                        row: __classPrivateFieldGet(this, _TracksRow_options, "f").row,
                        column: __classPrivateFieldGet(this, _TracksRow_options, "f").column + trackIndex,
                        color: isArmed ? __classPrivateFieldGet(this, _TracksRow_options, "f").armedTrackColor : __classPrivateFieldGet(this, _TracksRow_options, "f").unarmedTrackColor
                    });
                });
            }
        }
        handleMidi(midi) {
            // SWITCH TRACKS
            const baseButton = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _TracksRow_options, "f").row, column: __classPrivateFieldGet(this, _TracksRow_options, "f").column });
            for (let trackIndex = 0; trackIndex < __classPrivateFieldGet(this, _TracksRow_options, "f").numberOfTracks; trackIndex++) {
                if (midi.type === L.NOTE_ON && midi.data1 === baseButton + trackIndex) {
                    this.bitwig.armTrack(trackIndex + __classPrivateFieldGet(this, _TracksRow_options, "f").firstTrackIndex);
                    return true;
                }
            }
            return false;
        }
    }
    _TracksRow_options = new WeakMap();
    L.TracksRow = TracksRow;
})(L || (L = {}));
var L;
(function (L) {
    var _UndoRedo_options;
    class UndoRedo extends L.ControllerModule {
        constructor(context, options) {
            super(context);
            _UndoRedo_options.set(this, void 0);
            __classPrivateFieldSet(this, _UndoRedo_options, options, "f");
        }
        init() {
            this.addInitCallback(() => {
                this.controller.setLight({ row: __classPrivateFieldGet(this, _UndoRedo_options, "f").row, column: __classPrivateFieldGet(this, _UndoRedo_options, "f").column, color: __classPrivateFieldGet(this, _UndoRedo_options, "f").color });
            });
        }
        handleMidi(midi) {
            const buttonNote = this.controller.coordinateToControlSplitButton({ row: __classPrivateFieldGet(this, _UndoRedo_options, "f").row, column: __classPrivateFieldGet(this, _UndoRedo_options, "f").column });
            if (midi.type === L.NOTE_ON && midi.data1 === buttonNote) {
                this.pressHandler.handlePressBegin(() => this.bitwig.application.undo(), () => this.bitwig.application.redo(), midi.data1);
                return true;
            }
            if (midi.type === L.NOTE_OFF && midi.data1 === buttonNote) {
                this.pressHandler.handlePressEnd(midi.data1);
                return true;
            }
            return false;
        }
    }
    _UndoRedo_options = new WeakMap();
    L.UndoRedo = UndoRedo;
})(L || (L = {}));
var L;
(function (L) {
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
        handlePressBegin(shortPress, longPress, buttonId, millis = 500) {
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
    L.PressHandler = PressHandler;
})(L || (L = {}));
var L;
(function (L) {
    //  __               __
    // |  |_.---.-.-----|  |--.--------.---.-.-----.---.-.-----.-----.----.
    // |   _|  _  |__ --|    <|        |  _  |     |  _  |  _  |  -__|   _|
    // |____|___._|_____|__|__|__|__|__|___._|__|__|___._|___  |_____|__|
    //                                                   |_____|
    var _TaskManager_scheduledTasks, _TaskManager_host;
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
    L.TaskManager = TaskManager;
})(L || (L = {}));
var L;
(function (L) {
    function sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }
    L.sleep = sleep;
})(L || (L = {}));
