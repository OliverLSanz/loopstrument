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
    this.tracks = host.createMainTrackBank(5, 0, 3)
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
}

//  __               __
// |  |_.---.-.-----|  |--.--------.---.-.-----.---.-.-----.-----.----.
// |   _|  _  |__ --|    <|        |  _  |     |  _  |  _  |  -__|   _|
// |____|___._|_____|__|__|__|__|__|___._|__|__|___._|___  |_____|__|
//                                                   |_____|

// Used to schedule tasks for future execution

type ScheduledTasks = Set<string>

export class TaskManager {
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

export class PressHandler {
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

class LiveLoopingController {
  bitwig: Bitwig
  pressHandler: PressHandler
  linn: LinnStrument

  constructor(bitwig: Bitwig, pressHandler: PressHandler, linnstrument: LinnStrument){
    this.bitwig = bitwig
    this.pressHandler = pressHandler
    this.linn = linnstrument

    // Turn off all lights
    rowIndexes.forEach((rowIndex) => {
      columnIndexes.forEach((columnIndex) => {
        this.linn.setLight({ row: rowIndex, column: columnIndex, color: "off" })
      })
    })
    // set undo button light
    this.linn.setLight({ row: 7, column: 1, color: "magenta" })
    // set redo button light
    this.linn.setLight({ row: 7, column: 2, color: "blue" })

    // Start observers
    for (let trackIndex = 0; trackIndex < 5; trackIndex++) {
      const track = bitwig.tracks.getItemAt(trackIndex)
      track.isStopped().markInterested()
      track.isActivated().markInterested()

      track.arm().addValueObserver((isArmed: boolean) => {
        this.linn.setLight({ row: 0 as row, column: trackIndex, color: isArmed ? "magenta" : "off" })
      })

      for (let clipIndex = 0; clipIndex < 3; clipIndex++) {
        const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

        clip.isPlaying().addValueObserver((_) => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
        clip.isRecording().addValueObserver((_) => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
        clip.hasContent().addValueObserver((_) => {
          this.#updateClipLight(trackIndex, track, clipIndex)
        })
      }
    }

    bitwig.transport.isClipLauncherOverdubEnabled().addValueObserver(overdubEnabled => {
      this.linn.setLight({ row: 7, column: 0, color: overdubEnabled ? "red" : "white" })
    })

    this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));

    // Channel 0: Used to control bitwig
    // Channels 1-15: Used for MPE
    this.bitwig.host.getMidiInPort(0)
      .createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????",
        "?5????", "?6????", "?7????", "?8????", "?9????", "?A????",
        "?B????", "?C????", "?D????", "?E????", "?F????")
      .setUseExpressiveMidi(true, 0, 48);
  }

  handleMidi(status: number, data1: number, data2: number){
    const type = status >> 4
    const channel = status % 16
    // SWITCH TRACKS
    if (type === NOTE_ON && data1 === 65) {
      this.bitwig.armTrack(0)
    }
    if (type === NOTE_ON && data1 === 66) {
      this.bitwig.armTrack(1)
    }
    if (type === NOTE_ON && data1 === 67) {
      this.bitwig.armTrack(2)
    }
    if (type === NOTE_ON && data1 === 68) {
      this.bitwig.armTrack(3)
    }
    if (type === NOTE_ON && data1 === 69) {
      this.bitwig.armTrack(4)
    }

    // CLIPS
    if (type === NOTE_ON && data1 >= 50 && data1 <= 64) {
      const trackIndex = data1 % 5
      const track = this.bitwig.tracks.getItemAt(trackIndex)
      const clipIndex = Math.floor(Math.abs(data1 - 64) / 5)
      const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

      function onTap() {
        if (clip.isPlaying().getAsBoolean()) {
          track.stop()
        } else {
          clip.launch()
        }
      }

      function onLongPress() {
        clip.deleteObject()
      }

      this.pressHandler.handlePressBegin(onTap, onLongPress, 1000, data1)
    }

    if (type === NOTE_OFF && data1 >= 50 && data1 <= 64) {
      this.pressHandler.handlePressEnd(data1)
    }

    if (type === NOTE_ON && data1 === 30) {
      const overdubEnabled = this.bitwig.transport.isClipLauncherOverdubEnabled().getAsBoolean()
      this.bitwig.transport.isClipLauncherOverdubEnabled().set(!overdubEnabled)
    }

    if (type === NOTE_ON && data1 === 31) {
      this.bitwig.application.undo()
    }

    if (type === NOTE_ON && data1 === 32) {
      this.bitwig.application.redo()
    }
  }

  #updateClipLight(trackIndex: number, track: API.Track, clipIndex: number) {
    const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

    if (clip.isRecording().getAsBoolean()) {
      this.linn.setLight({ row: clipIndex + 1 as row, column: trackIndex, color: "red" })
      return
    }
    if (clip.isPlaying().getAsBoolean()) {
      this.linn.setLight({ row: clipIndex + 1 as row, column: trackIndex, color: "blue" })
      return
    }
    if (clip.hasContent().getAsBoolean()) {
      this.linn.setLight({ row: clipIndex + 1 as row, column: trackIndex, color: "white" })
      return
    }
    // Clip is empty
    this.linn.setLight({ row: clipIndex + 1 as row, column: trackIndex, color: "off" })
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

  new LiveLoopingController(bitwig, pressHandler, linn)

  println("LinnstrumentLooping initialized!");
}


function flush() {
  // Flush any output to your controller here.
}

function exit() {
  // This gets called on exit
}