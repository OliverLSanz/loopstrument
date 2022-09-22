loadAPI(17);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Roger Linn Design", "LinnstrumentLooping", "0.1", "e72dbb9b-ba1c-405e-998e-6a96dee48830", "OliverLSanz");

host.defineMidiPorts(1, 1);

let tracks: API.TrackBank
let transport: API.Transport
let application: API.Application

let scheduledTasks: Set<string> = new Set<string>()
let longPressTasks: { [note: number]: { taskId: string, shortPress: ()=>void } } = {}

if (host.platformIsWindows())
{
   // TODO: Set the correct names of the ports for auto detection on Windows platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
else if (host.platformIsMac())
{
   // TODO: Set the correct names of the ports for auto detection on Mac OSX platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}
else if (host.platformIsLinux())
{
   // TODO: Set the correct names of the ports for auto detection on Linux platform here
   // and uncomment this when port names are correct.
   // host.addDeviceNameBasedDiscoveryPair(["Input Port 0"], ["Output Port 0"]);
}

function init() {
   transport = host.createTransport();
   tracks = host.createMainTrackBank(5, 0, 3)
   application = host.createApplication()
   host.getMidiInPort(0).setMidiCallback(onMidi0);

   // Channel 0: Used to control bitwig
   // Channels 1-15: Used for MPE
   const noteIn = host.getMidiInPort(0)
      .createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????",
         "?5????", "?6????", "?7????", "?8????", "?9????", "?A????",
         "?B????", "?C????", "?D????", "?E????", "?F????")
      .setUseExpressiveMidi(true, 0, 48);

   initLights()
   initObservers()

   println("LinnstrumentLooping initialized!");
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

function setLight({ row, column, color }: { row: row; column: number; color: lightColor }){
   // 20 is for select column to change color, 1 is first play column.
   midiOut({ type: CC, channel: 0, data1: 20, data2: column + 1 })
   // 21 for select row. Top is 7.
   midiOut({ type: CC, channel: 0, data1: 21, data2: Math.abs(row - 7) })
   // 22 to set color, 1 is red
   midiOut({ type: CC, channel: 0, data1: 22, data2: lightColorValues[color] })
}

function initLights(){
   // undo
   setLight({ row: 7, column: 1, color: "magenta" })
   // redo
   setLight({ row: 7, column: 2, color: "blue" })
}

function updateClipLight(trackIndex: number, clipIndex: number){
   const track = tracks.getItemAt(trackIndex)
   const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

   if(clip.isRecording().getAsBoolean()) {
      setLight({ row: clipIndex+1 as row, column: trackIndex, color: "red" })
      return
   }
   if(clip.isPlaying().getAsBoolean()) {
      setLight({ row: clipIndex+1 as row, column: trackIndex, color: "blue" })
      return
   }
   if(clip.hasContent().getAsBoolean()) {
      setLight({ row: clipIndex+1 as row, column: trackIndex, color: "white" })
      return
   }
   // Clip is empty
   setLight({ row: clipIndex+1 as row, column: trackIndex, color: "off" })
}

function initObservers(){
   for(let trackIndex = 0; trackIndex < 5; trackIndex++){
      const track = tracks.getItemAt(trackIndex)
      track.isStopped().markInterested()
      track.isActivated().markInterested()

      track.arm().addValueObserver((isArmed: boolean) => {
         setLight({ row: 0 as row, column: trackIndex, color: isArmed? "magenta" : "off" })
      })

      for(let clipIndex = 0; clipIndex < 3; clipIndex++){
         const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

         clip.isPlaying().addValueObserver( ( _ ) => {
            updateClipLight(trackIndex, clipIndex)
         })
         clip.isRecording().addValueObserver( ( _ ) => {
            updateClipLight(trackIndex, clipIndex)
         })
         clip.hasContent().addValueObserver( ( _ ) => {
            updateClipLight(trackIndex, clipIndex)
         })
      }
   }
}

function armOneTrack(trackBank: API.TrackBank, trackIndex: number) {
   const bankSize = trackBank.getSizeOfBank()

   for(let i = 0; i < bankSize; i++) {
      trackBank.getItemAt(i).arm().set(trackIndex === i)
   }
}

const NOTE_OFF = 8
const NOTE_ON = 9
const CC = 11

interface MidiMessage {
   type: number,
   channel: number,
   data1: number,
   data2: number
}

function midiOut({ type, channel, data1, data2 }: MidiMessage){
   const status = type << 4 + channel
   host.getMidiOutPort(0).sendMidi(status, data1, data2)
}

function scheduleTask(task: () => void, millis: number){
   const taskUID = new Date().toISOString()
   scheduledTasks.add(taskUID)

   host.scheduleTask(() => {
      if(scheduledTasks.has(taskUID)){
         task()
         scheduledTasks.delete(taskUID)
      }
   }, millis)

   return taskUID
}

function handlePressBegin(shortPress: () => void, longPress: () => void, millis: number, buttonId: number){
   const taskId = scheduleTask(() => {
      longPress()
      delete longPressTasks[buttonId]
   }, millis)
   longPressTasks[buttonId] = { taskId, shortPress }
}

function handlePressEnd(buttonId: number){
   if(longPressTasks[buttonId] !== undefined) {
      longPressTasks[buttonId].shortPress()
      scheduledTasks.delete(longPressTasks[buttonId].taskId)
      delete longPressTasks[buttonId]
   }
}

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0 (status: number, data1: number, data2: number){
   // TODO: Implement your MIDI input handling code here.

   const type = status >> 4
   const channel = status % 16

   // SWITCH TRACKS
   if(type === NOTE_ON && data1 === 65){
      armOneTrack(tracks, 0)
   }
   if(type === NOTE_ON && data1 === 66){
      armOneTrack(tracks, 1)
   }
   if(type === NOTE_ON && data1 === 67){
      armOneTrack(tracks, 2)
   }
   if(type === NOTE_ON && data1 === 68){
      armOneTrack(tracks, 3)
   }
   if(type === NOTE_ON && data1 === 69){
      armOneTrack(tracks, 4)
   }

   // CLIPS
   if(type === NOTE_ON && data1 >= 50 && data1 <= 64){
      const trackIndex = data1 % 5
      const track = tracks.getItemAt(trackIndex)
      const clipIndex = Math.floor(Math.abs(data1 - 64)/5)
      const clip = track.clipLauncherSlotBank().getItemAt(clipIndex)

      function onTap(){
         if(clip.isPlaying().getAsBoolean()){
            track.stop()
         }else{
            clip.launch()
         }
      }

      function onLongPress(){
         clip.deleteObject()
      }

      handlePressBegin(onTap, onLongPress, 1000, data1)
   }

   if(type === NOTE_OFF && data1 >= 50 && data1 <= 64){
      handlePressEnd(data1)
   }

   if(type === NOTE_ON && data1 === 31){
      application.undo()
   }

   if(type === NOTE_ON && data1 === 32){
      application.redo()
   }
}

function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}