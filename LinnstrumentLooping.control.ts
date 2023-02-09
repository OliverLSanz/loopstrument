// It is not straightforward to use different ts files in a bitwig script
// So for now I'm just using one big file with fancy titles :-)

// Dependencies point downwards in the file. A section won't use anything
// in sections below it.

//  __                              __,-,__                           __
// |  |_.--.--.-----.-----.-----.  |  ' '__|  .----.-----.-----.-----|  |_.-----.
// |   _|  |  |  _  |  -__|__ --|  |     __|  |  __|  _  |     |__ --|   _|__ --|
// |____|___  |   __|_____|_____|  |_______|  |____|_____|__|__|_____|____|_____|
//      |_____|__|                    |_|
interface MidiMessage {
  type: number,
  channel: number,
  data1: number,
  data2: number
}

type lightColor = "default" | "red" | "yellow" | "green" | "cyan" | "blue" | "magenta" | "off" | "white" | "orange" | "lime" | "pink"
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
}

type row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
type column = 0 | 1 | 2 | 3 | 4
const rowIndexes: row[] = [0, 1, 2, 3, 4, 5, 6, 7]
const columnIndexes: column[] = [0, 1, 2, 3, 4]

const NOTE_OFF = 8
const NOTE_ON = 9
const CC = 11

const MAX_MIDI_NOTE = 127

function sleep(milliseconds: number) {
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
  host: API.ControllerHost
  transport: API.Transport
  tracks: API.TrackBank
  application: API.Application

  constructor(host: API.ControllerHost){
    this.host = host
    this.transport = host.createTransport()
    this.tracks = host.createMainTrackBank(15, 0, 8)
    this.application = host.createApplication()
  }

  armTrack(trackIndex: number) {
    const bankSize = this.tracks.getSizeOfBank()

    for (let i = 0; i < bankSize; i++) {
      this.tracks.getItemAt(i).arm().set(trackIndex === i)
    }

    const selectedTrack = this.tracks.getItemAt(trackIndex)
    selectedTrack.selectInEditor()
    selectedTrack.selectInMixer()
    selectedTrack.makeVisibleInArranger()
    selectedTrack.makeVisibleInMixer()
  }

  midiOut({ type, channel, data1, data2 }: MidiMessage) {
    const status = type << 4 + channel
    this.host.getMidiOutPort(0).sendMidi(status, data1, data2)
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

type Split = "left" | "right"

class LinnStrument {
  #bitwig: Bitwig

  constructor(bitwig: Bitwig){
    this.#bitwig = bitwig
  }

  setLight({ row, column, color }: { row: row; column: number; color: lightColor }) {
    // 20 is for select column to change color, 1 is first play column.
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 20, data2: column + 1 })
    // 21 for select row. Top is 7.
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 21, data2: Math.abs(row - 7) })
    // 22 to set color, 1 is red
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 22, data2: lightColorValues[color] })
  }

  resetLights() {
    rowIndexes.forEach(row => {
      columnIndexes.forEach(column => {
        this.setLight({row, column, color: "default"})
      })
    })
  }

  turnOffLights() {
    rowIndexes.forEach(row => {
      columnIndexes.forEach(column => {
        this.setLight({row, column, color: "off"})
      })
    })
  }

  sendNRPN(number: number, value: number) {
    const MSBNumber = number >> 7
    const LSBNumber = number % 128
    const MSBValue = value >> 7
    const LSBValue = value % 128

    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 99, data2: MSBNumber })
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 98, data2: LSBNumber })
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 6, data2: MSBValue })
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 38, data2: LSBValue })
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 101, data2: 127 })
    this.#bitwig.midiOut({ type: CC, channel: 0, data1: 100, data2: 127 })
    sleep(50)
  }


  setMidiMode(mode: "OneChannel" | "ChannelPerNote" | "ChannelPerRow", split: Split){
    let value
    if(mode == "OneChannel"){
      value = 0
    }else if(mode == "ChannelPerNote"){
      value = 1
    }else{
      value = 2
    }

    this.sendNRPN(split == "left" ? 0: 100, value)
  }

  /**
   * 
   * @param value only supports, 0: No overlap, 3 4 5 6 7 12: Intervals, 13: Guitar, 127: 0 offset
   */
  setRowOffset(value: number){
    this.sendNRPN(227, value)
  }

  /**
   * 
   * @param channel From 0 to 15
   */
  setMidiMainChannel(channel: number, split: Split){
    this.sendNRPN(split == "left" ? 1: 101, channel+1)
  }

  /**
   * 
   * @param channel From 0 to 15
   * @param enabled 
   */
  setMidiPerNoteChannel(channel: number, enabled: boolean, split: Split){
    this.sendNRPN(split == "left" ? 2+channel : 102+channel, enabled? 1: 0)
  }

  /**
   * 
   * @param range From 1 to 96
   */
  setMidiBendRange(range: number, split: Split){
    this.sendNRPN(split === "left" ? 19 : 119, range)
  }

  /**
   * 
   * @param octaves 0-10, 5 is +0
   * @param semitones 0-14, 0-6: -7 to -1, 7: 0, 8-14: +1 to +7
   */
  setTransposition(octaves: number, semitones: number){
    // Left Octave
    this.sendNRPN(36, octaves)
    // Left Pitch
    this.sendNRPN(37, semitones)
    // Right Octave
    this.sendNRPN(136, octaves)
    // Right Pitch
    this.sendNRPN(137, semitones)
  }

  setSplitActive(active: boolean){
    this.sendNRPN(200, active? 1 : 0)
  }

  /**
   * 
   * @param column Start of second split: 2-25
   */
  setSplitPoint(column: number){
    this.sendNRPN(202, column)
  }

  setSelectedSplit(split: Split){
    this.sendNRPN(201, split == "left" ? 0 : 1)
  }

  // Below this line: unused and not tested
  setPitchQuantize(enabled: boolean, split: Split){
    this.sendNRPN(split == "left"? 21 : 121, enabled ? 1 : 0)
  }

  setPitchQuantizeHold(mode: "Off" | "Medium" | "Fast" | "Slow", split: Split){
    const translation = {
      "Off": 0, "Medium": 1, "Fast": 2, "Slow": 3
    }
    this.sendNRPN(split == "left"? 22 : 122, translation[mode])
  }

  setSendX(enabled: boolean, split: Split){
    this.sendNRPN(split == "left"? 20 : 120, enabled ? 1 : 0)
  }
}

//  __               __
// |  |_.---.-.-----|  |--.--------.---.-.-----.---.-.-----.-----.----.
// |   _|  _  |__ --|    <|        |  _  |     |  _  |  _  |  -__|   _|
// |____|___._|_____|__|__|__|__|__|___._|__|__|___._|___  |_____|__|
//                                                   |_____|

// Used to schedule tasks for future execution

type ScheduledTasks = Set<string>

class TaskManager {
  #scheduledTasks: ScheduledTasks
  #host: API.ControllerHost

  constructor(host: API.ControllerHost){
    this.#scheduledTasks = new Set<string>()
    this.#host = host
  }

  scheduleTask(task: () => void, millis: number) {
    const taskUID = new Date().toISOString()
    this.#scheduledTasks.add(taskUID)

    this.#host.scheduleTask(() => {
      if (this.#scheduledTasks.has(taskUID)) {
        task()
        this.#scheduledTasks.delete(taskUID)
      }
    }, millis)

    return taskUID
  }

  cancelTask(taskId: string){
    this.#scheduledTasks.delete(taskId)
  }
}

//                               __                   __ __
// .-----.----.-----.-----.-----|  |--.---.-.-----.--|  |  .-----.----.
// |  _  |   _|  -__|__ --|__ --|     |  _  |     |  _  |  |  -__|   _|
// |   __|__| |_____|_____|_____|__|__|___._|__|__|_____|__|_____|__|
// |__|

// Allows setting different callbacks for taps and long-presses

class PressHandler {
  longPressTasks: { [note: number]: { taskId: string, shortPress: () => void } }
  taskManager: TaskManager

  constructor(taskManager: TaskManager){
    this.longPressTasks = {}
    this.taskManager = taskManager
  }

  handlePressBegin(shortPress: () => void, longPress: () => void, millis: number, buttonId: number) {
    const taskId = this.taskManager.scheduleTask(() => {
      longPress()
      delete this.longPressTasks[buttonId]
    }, millis)
    this.longPressTasks[buttonId] = { taskId, shortPress }
  }

  handlePressEnd(buttonId: number) {
    if (this.longPressTasks[buttonId] !== undefined) {
      this.longPressTasks[buttonId].shortPress()
      this.taskManager.cancelTask(this.longPressTasks[buttonId].taskId)
      delete this.longPressTasks[buttonId]
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

interface ModuleContext {
  bitwig: Bitwig, 
  pressHandler: PressHandler, 
  linnstrument: LinnStrument, 
  controller: LiveLoopingController
}

class ControllerModule {
  bitwig: Bitwig
  pressHandler: PressHandler
  linn: LinnStrument
  controller: LiveLoopingController
  #onUpdate: Function[]

  constructor(context: ModuleContext) {
    this.bitwig = context.bitwig
    this.pressHandler = context.pressHandler
    this.linn = context.linnstrument
    this.controller = context.controller
    this.#onUpdate = []
  }

  init(): void{ }

  update(): void{
    this.#onUpdate.forEach(callback => callback())
  }

  handleMidi(midi: MidiMessage): boolean { return false }

  addValueObserver(subject: {addValueObserver: Function}, callback: ()=>any): void {
    subject.addValueObserver(callback)
    this.#onUpdate.push(callback)
  }

  addInitCallback(callback: ()=>void): void {
    callback()
    this.#onUpdate.push(callback)
  }
}

interface TracksRowOptions {
  row: number,
  column: number, 
  numberOfTracks: number,
  firstTrackIndex: number
}

class TracksRow extends ControllerModule {
  #options: TracksRowOptions

  constructor(context: ModuleContext, options: TracksRowOptions){
    super(context)
    this.#options = options
  }

  init(): void {
    for (let trackIndex = 0; trackIndex < this.#options.numberOfTracks; trackIndex++) {
      const track = this.bitwig.tracks.getItemAt(trackIndex + this.#options.firstTrackIndex)

      this.addValueObserver(track.arm(), () => {
        const isArmed = track.arm().get()
        this.controller.setLight({row: this.#options.row as row, column: this.#options.column + trackIndex as column, color: isArmed ? "magenta" : "off"})
      })
    }
  }

  handleMidi(midi: MidiMessage): boolean {
    // SWITCH TRACKS
    const baseButton = this.controller.coordinateToControlSplitButton({row: this.#options.row, column: this.#options.column})

    for (let trackIndex = 0; trackIndex < this.#options.numberOfTracks; trackIndex++) {
      if (midi.type === NOTE_ON && midi.data1 === baseButton+trackIndex) {
        this.bitwig.armTrack(trackIndex + this.#options.firstTrackIndex)
        return true
      }
    }

    return false
  }
}

interface ClipArrayOptions {
  row: number,
  column: number,
  numberOfTracks: number,
  firstTrackIndex: number,
  clipsPerTrack: number,
}

class ClipArray extends ControllerModule {
  #options: ClipArrayOptions

  constructor(context: ModuleContext, options: ClipArrayOptions){
    super(context)
    this.#options = options
  }

  init(): void{
    // Start observers
    for (let trackIndex = 0; trackIndex < this.#options.numberOfTracks; trackIndex++) {
      const track = this.bitwig.tracks.getItemAt(trackIndex + this.#options.firstTrackIndex)
      track.arm().markInterested()

      for (let clipIndex = 0; clipIndex < this.#options.clipsPerTrack; clipIndex++) {
        const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

        this.addValueObserver(clip.isPlaying(), () => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
        this.addValueObserver(clip.isPlaying(), () => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
        this.addValueObserver(clip.isRecording(), () => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
        this.addValueObserver(clip.hasContent(), () => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
      }
    }
  }

  handleMidi(midi: MidiMessage): boolean {
    const { row, column } = this.controller.controlSplitButtonToCoordinate(midi.data1)

    if( row >= this.#options.row && row < this.#options.row + this.#options.clipsPerTrack 
        && column >= this.#options.column && column < this.#options.column + this.#options.numberOfTracks ){
      if (midi.type === NOTE_ON) {
        const trackIndex = column - this.#options.column
        const clipIndex = row - this.#options.row

        const track = this.bitwig.tracks.getItemAt(trackIndex + this.#options.firstTrackIndex)
        const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)
        const bitwig = this.bitwig
        const firstTrackIndex = this.#options.firstTrackIndex
        function onTap() {
          if(!clip.hasContent().getAsBoolean() && !track.arm().get()){
            bitwig.armTrack(trackIndex + firstTrackIndex) 
          }
          if (clip.isPlaying().getAsBoolean()) {
            track.stop()
          } else {
            clip.launch()
          }
        }

        function onLongPress() {
          clip.deleteObject()
        }

        this.pressHandler.handlePressBegin(onTap, onLongPress, 1000, midi.data1)
      }

      if (midi.type === NOTE_OFF) {
        this.pressHandler.handlePressEnd(midi.data1)
      }
      return true
    }

    return false
  }

  #updateClipLight(trackIndex: number, track: API.Track, clipIndex: number) {
    const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

    if (clip.isRecording().getAsBoolean()) {
      this.controller.setLight({ row: this.#options.row + clipIndex as row, column: this.#options.column + trackIndex as column, color: "red" })
      return
    }
    if (clip.isPlaying().getAsBoolean()) {
      this.controller.setLight({ row: this.#options.row + clipIndex as row, column: this.#options.column + trackIndex as column, color: "blue" })
      return
    }
    if (clip.hasContent().getAsBoolean()) {
      this.controller.setLight({ row: this.#options.row + clipIndex as row, column: this.#options.column + trackIndex as column, color: "white" })
      return
    }
    // Clip is empty
    this.controller.setLight({ row: this.#options.row + clipIndex as row, column: this.#options.column + trackIndex as column, color: "off" })
  }
}

interface LoopLengthOptions {
  row: number,
  column: number,
}

class LoopLength extends ControllerModule {
  #options: LoopLengthOptions
  #bars: number = 0
  #nextBars: number = 0
  #pressedButtons: [boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false]

  constructor(context: ModuleContext, options: LoopLengthOptions){
    super(context)
    this.#options = options
  }

  init(){
    this.addValueObserver(this.bitwig.transport.clipLauncherPostRecordingAction(), () => {
      this.updateLights()
    })
    this.addValueObserver(this.bitwig.transport.getClipLauncherPostRecordingTimeOffset(), () => {
      this.updateLights()
    })
    this.addValueObserver(this.bitwig.transport.timeSignature().numerator(), () => {
      this.setLoopLength()
    })
    this.addValueObserver(this.bitwig.transport.timeSignature().denominator(), () => {
      this.setLoopLength()
    })
  }

  setLoopLength(): void {
    const numberOfBars = this.#bars
    const numerator = this.bitwig.transport.timeSignature().numerator().get()
    const denominator = this.bitwig.transport.timeSignature().denominator().get()
    this.bitwig.transport.clipLauncherPostRecordingAction().set("play_recorded")
    this.bitwig.transport.getClipLauncherPostRecordingTimeOffset().set(4*numberOfBars*numerator/denominator)
  }

  updateLights(): void {
    const postRecordingOffset = this.bitwig.transport.getClipLauncherPostRecordingTimeOffset().get()
    const numerator = this.bitwig.transport.timeSignature().numerator().get()
    const denominator = this.bitwig.transport.timeSignature().denominator().get()
    const numberOfBars = ((postRecordingOffset/4)/numerator)*denominator

    const light1 = numberOfBars%2
    const light2 = (numberOfBars>>1) % 2
    const light3 = (numberOfBars>>2) % 2
    const light4 = (numberOfBars>>3) % 2
    const light5 = (numberOfBars>>4) % 2

    this.controller.setLight({row: this.#options.row as row, column: this.#options.column as column, color: light1 ? "blue" : "off"})
    this.controller.setLight({row: this.#options.row as row, column: this.#options.column + 1 as column, color: light2 ? "blue" : "off"})
    this.controller.setLight({row: this.#options.row as row, column: this.#options.column + 2 as column, color: light3 ? "blue" : "off"})
    this.controller.setLight({row: this.#options.row as row, column: this.#options.column + 3 as column, color: light4 ? "blue" : "off"})
    this.controller.setLight({row: this.#options.row as row, column: this.#options.column + 4 as column, color: light5 ? "blue" : "off"})
  }

  handleMidi(midi: MidiMessage): boolean {
    const baseNote = this.controller.coordinateToControlSplitButton({row: this.#options.row, column: this.#options.column})
    const receivedNote = midi.data1
    const button = receivedNote - baseNote

    if(button < 0 || button > 4){
      return false
    }

    if(midi.type === NOTE_OFF){
      this.#pressedButtons[button] = false

      if(this.#pressedButtons.every(button => button === false)){
        // Interaction ended

        if(this.#bars == this.#nextBars){
          // disable
          this.#bars = 0
        } else {
          this.#bars = this.#nextBars
        }
        this.#nextBars = 0

        this.setLoopLength()
      }

      return true
    }

    if(midi.type === NOTE_ON){
      this.#pressedButtons[button] = true
      this.#nextBars += 1 << button

      return true
    }

    return false
  }
}

interface UndoRedoOptions {
  row: number,
  column: number
}

class UndoRedo extends ControllerModule {
  #options: UndoRedoOptions

  constructor(context: ModuleContext, options: UndoRedoOptions){
    super(context)
    this.#options = options
  }

  init(): void {
    this.addInitCallback(() => {
      this.controller.setLight({row: this.#options.row as row, column: this.#options.column as column, color: "magenta"})
    })
  }

  handleMidi(midi: MidiMessage): boolean {
    const buttonNote = this.controller.coordinateToControlSplitButton({row: this.#options.row, column: this.#options.column})

    if (midi.type === NOTE_ON && midi.data1 === buttonNote) {
      this.pressHandler.handlePressBegin(() => this.bitwig.application.undo(), () => this.bitwig.application.redo(), 500, midi.data1)
      return true
    }

    if(midi.type === NOTE_OFF && midi.data1 === buttonNote){
      this.pressHandler.handlePressEnd(midi.data1)
      return true
    }

    return false
  }
}

interface OverdubToggleOptions {
  row: number,
  column: number
}

class OverdubToggle extends ControllerModule {
  #options: OverdubToggleOptions

  constructor(context: ModuleContext, options: OverdubToggleOptions){
    super(context)
    this.#options = options
  }

  init(): void {
    this.addValueObserver(this.bitwig.transport.isClipLauncherOverdubEnabled(), () => {
      const isOverdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().get()
      this.controller.setLight({ row: this.#options.row as row, column: this.#options.column as column, color: isOverdubEnabled ? "red" : "white" })
    })
  }

  handleMidi(midi: MidiMessage): boolean {
    const buttonNote = this.controller.coordinateToControlSplitButton({row: this.#options.row, column: this.#options.column})

    if(this.controller.isInterfaceEnabled()){
      if (midi.type === NOTE_ON && midi.data1 === buttonNote) {
        const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean()
        this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled)
        return true
      }
    }
    return false
  }
}

interface InterfaceToggleOptions {
  rowWhileEnabled: number,
  columnWhileEnabled: number,
  rowWhileDisabled: number,
  columnWhileDisabled: number
}

class InterfaceToggle extends ControllerModule {
  #options: InterfaceToggleOptions

  constructor(context: ModuleContext, options: InterfaceToggleOptions){
    super(context)
    this.#options = options
  }

  init(): void {
    this.addInitCallback(() => {
      if(this.controller.isInterfaceEnabled()){
        this.controller.setLight({row: this.#options.rowWhileEnabled as row, column: this.#options.columnWhileEnabled as column, color: 'yellow'})
      }else{
        this.controller.setLight({row: this.#options.rowWhileDisabled as row, column: this.#options.columnWhileDisabled as column, color: 'yellow'}, true)
      }
    })
  }

  handleMidi(midi: MidiMessage): boolean {
    const buttonWhileEnabled = this.controller.coordinateToControlSplitButton({row: this.#options.rowWhileEnabled, column: this.#options.columnWhileEnabled})
    const buttonWhileDisabled = 0

    if(this.controller.isInterfaceEnabled()){
      if (midi.type === NOTE_ON && midi.data1 === buttonWhileEnabled) {
        this.controller.toggleInterface()
        return true
      }
      return false
    }
    if(midi.type === NOTE_ON && midi.data1 === buttonWhileDisabled){
      this.controller.toggleInterface()
      return true
    }

    return false
  }
}

interface MetronomeOptions {
  row: number,
  column: number
}

class Metronome extends ControllerModule {
  #options: MetronomeOptions

  constructor(context: ModuleContext, options: MetronomeOptions){
    super(context)
    this.#options = options
  }

  init(): void {
    this.addValueObserver(this.bitwig.transport.isMetronomeEnabled(), () => {
      const metronomeEnabled = this.bitwig.transport.isMetronomeEnabled().get()
      this.controller.setLight({row: this.#options.row as row, column: this.#options.column as column, color: metronomeEnabled? "orange" : "white"})
    })
  }

  #onTap(){
    this.bitwig.transport.tapTempo()
  }

  #onLongPress(){
    this.bitwig.transport.isMetronomeEnabled().toggle()
  }

  handleMidi(midi: MidiMessage): boolean {
    const button = this.controller.coordinateToControlSplitButton({row: this.#options.row, column: this.#options.column})

    if (midi.type === NOTE_ON && midi.data1 === button) {
      this.pressHandler.handlePressBegin(() => this.#onTap(), () => this.#onLongPress(), 500, midi.data1)
      return true
    }

    if(midi.type === NOTE_OFF && midi.data1 === button){
      this.pressHandler.handlePressEnd(midi.data1)
      return true
    }

    return false
  }
}

class Debug extends ControllerModule {
  init(): void {
  }

  handleMidi(midi: MidiMessage): boolean {
    let message = ""
    const Y_CC = 74
    if(midi.type == NOTE_ON){
      message +="   NOTE ON "
    }else if(midi.type == NOTE_OFF){
      message +="  NOTE OFF "
    }else if(midi.type == CC && midi.data1 == Y_CC){
      message +="      Y CC "
    }else if(midi.type == CC){
      message +="        CC "
    }else{
      message +="           "
    }
    message += `CH ${midi.channel} TY ${midi.type} D1 ${midi.data1} D2 ${midi.data2}`
    println(message)
    return false
  }
}

interface ControllerOptions {
  expandedControlAreaWidth: number
}

class LiveLoopingController {
  bitwig: Bitwig
  pressHandler: PressHandler
  #keyTranslationTable: number[]
  #noteInput: API.NoteInput
  #interfaceEnabled: boolean
  #linn: LinnStrument
  linn: LinnStrument
  #modules: ControllerModule[]
  #controlAreaWidth: number

  #options: ControllerOptions

  #width = 16
  #height = 8
  #noteOffset = 30  // note played by the lowest key in the play area
  #collapsedControlAreaWidth = 0
  #rowOffset = 5  // distance in semitomes while going 1 row up
  #noteColors: lightColor[] = ['orange', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off']
  #firstControlAreaButton = 0

  constructor(bitwig: Bitwig, pressHandler: PressHandler, linnstrument: LinnStrument, options: ControllerOptions){
    this.bitwig = bitwig
    this.pressHandler = pressHandler
    this.#linn = linnstrument
    this.linn = linnstrument
    this.#options = options
    this.#modules = []
    this.#interfaceEnabled = true
    this.#keyTranslationTable = []
    this.#controlAreaWidth = this.#options.expandedControlAreaWidth

    this.#noteInput = this.bitwig.host.getMidiInPort(0).createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????")
    this.#noteInput.setUseExpressiveMidi(true, 0, 24);
  }

  addModules(modules: ControllerModule[]): void {
    this.#modules = this.#modules.concat(modules)
  }

  start(){
    this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
    this.bitwig.host.getMidiInPort(0)
    this.#configureLinnstrument()
    this.#modules.forEach(module => {
      module.init()
    })
    this.#update()
  }

  #configureLinnstrument() {
    // Global settings
    this.#linn.setRowOffset(0)
    this.#linn.setTransposition(3, 1)
    this.#linn.setSplitActive(true)
    this.#linn.setSplitPoint(this.#controlAreaWidth+1)
    
    // Left split
    this.#linn.setMidiBendRange(24, 'left')
    this.#linn.setMidiMode("OneChannel", 'left')
    this.#linn.setMidiMainChannel(0, 'left')
    
    // Right split
    this.#linn.setMidiBendRange(24, 'right')
    this.#linn.setMidiMode("ChannelPerNote", 'right')
    Array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15).forEach(i => {
      this.#linn.setMidiPerNoteChannel(i, true, 'right')
    })
  }

  #getPlayAreaWidth(){
    return this.#width - this.#controlAreaWidth
  }

  coordinateToControlSplitButton({row, column}: {row: number, column: number}): number {
    if(!this.#interfaceEnabled){
      return 999
    }
    return this.#firstControlAreaButton + (7-row)*this.#controlAreaWidth + column
  }

  controlSplitButtonToCoordinate(button: number): { row: number, column: number } {
    const row = 7 - Math.floor((button - this.#firstControlAreaButton) / this.#controlAreaWidth)
    const column = button % this.#controlAreaWidth
    return { row, column } 
  } 

  #buttonToNote(buttonIndex: number): number{
    let interfaceOffset = 0

    // This ensures the same notes are played by the same buttons
    // regardless of the interface state
    if(this.#interfaceEnabled){
      const columnDifference = this.#options.expandedControlAreaWidth - this.#collapsedControlAreaWidth
      interfaceOffset = columnDifference
    }

    const rowDecrement = this.#getPlayAreaWidth() - this.#rowOffset

    const currentRow = Math.floor((buttonIndex)/this.#getPlayAreaWidth())
    const rowAdjustment = currentRow*rowDecrement
    const note = buttonIndex - rowAdjustment + this.#noteOffset + interfaceOffset

    return note
  }

  #setPlayAreaLights(){
    for(let row = 0; row < this.#height; row++){
      for(let column = 0; column < this.#width; column++){
        const playAreaColumn = column - this.#controlAreaWidth
        if(playAreaColumn >= 0){
          const playAreaButton = row * this.#getPlayAreaWidth() + playAreaColumn
          const note = this.#buttonToNote(playAreaButton) % 12
          const color = this.#noteColors[note]
          this.setLight({row: 7-row as row, column: column as column, color}, true)
        }else{
          this.setLight({row: 7-row as row, column: column as column, color: "off"}, true)
        }
      }
    }
  }

  setButtonLight(button: number, color: lightColor, force?: boolean){
    const buttonOffset = 0  // number of the first button
    const buttonsPerRow = 16
    const row = Math.floor((button - buttonOffset)/buttonsPerRow)
    const column = button - row*buttonsPerRow
    this.setLight({row: 7 - row as row, column: column as column, color}, force)
  }

  handleMidi(status: number, data1: number, data2: number){
    const type = status >> 4
    const channel = status % 16

    // Pass the midi message to each module.handleMidi until one returns true
    this.#modules.some(module => module.handleMidi({type, channel, data1, data2}))
  }

  #updateKeyTranslationTable(){
    const newTranslationTable = []
    if(this.#interfaceEnabled){
      for(let key = 0; key <= MAX_MIDI_NOTE; key++){
        newTranslationTable.push(this.#buttonToNote(key))
      }
    }else{
      for(let key = 0; key <= MAX_MIDI_NOTE; key++){
        if(key != 0){
          newTranslationTable.push(this.#buttonToNote(key))
        }else{
          newTranslationTable.push(-1)
        }
      }
    }
    this.#keyTranslationTable = newTranslationTable
    this.#noteInput.setKeyTranslationTable(this.#keyTranslationTable)
  }

  toggleInterface(){
    this.#interfaceEnabled = !this.#interfaceEnabled
    this.#update()
  }

  isInterfaceEnabled(){
    return this.#interfaceEnabled
  }

  #update(){
    if(this.#interfaceEnabled){
      this.#controlAreaWidth = this.#options.expandedControlAreaWidth
    }else{
      this.#controlAreaWidth = this.#collapsedControlAreaWidth
    }

    this.#updateKeyTranslationTable()

    if(this.#interfaceEnabled){
      this.#linn.setSplitActive(true)
    }else{
      this.#linn.setSelectedSplit("right")
      this.#linn.setSplitActive(false)
    }

    if(this.#interfaceEnabled){
      this.#linn.turnOffLights()
    } else {
      this.#linn.resetLights()
    }

    this.#setPlayAreaLights()
    this.#modules.forEach(module => module.update())
  }

  setLight(options: {row: row, column: column, color: lightColor}, force: boolean = false){
    if(this.#interfaceEnabled || force){
      this.#linn.setLight(options)
    }
  }
}

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
  const taskManager = new TaskManager(host)
  const pressHandler = new PressHandler(taskManager)

  const bitwig = new Bitwig(host)
  const linn = new LinnStrument(bitwig)

  const controller = new LiveLoopingController(bitwig, pressHandler, linn, {expandedControlAreaWidth: 5})

  const context: ModuleContext = {
    bitwig: bitwig,
    pressHandler: pressHandler,
    linnstrument: linn,
    controller: controller
  }

  const modules: ControllerModule[] = [
    new Debug(context),
    new TracksRow(context, {row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5}),
    new ClipArray(context, {row: 1, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4}),
    new LoopLength(context, {row: 6, column: 0}),
    new UndoRedo(context, {row: 7, column: 3}),
    new OverdubToggle(context, {row: 7, column: 0}),
    new InterfaceToggle(context, { rowWhileEnabled: 7, columnWhileEnabled: 4, rowWhileDisabled: 7, columnWhileDisabled: 0 }),
    new Metronome(context, {row: 7, column: 1}),
    new ClipArray(context, {row: 5, column: 0, firstTrackIndex: 5, numberOfTracks: 5, clipsPerTrack: 1})
  ]

  controller.addModules(modules)
  controller.start()

  println("LinnstrumentLooping initialized!");
}


function flush() {
  // Flush any output to your controller here.
}

function exit() {
  // This gets called on exit
}