loadAPI(17);

// Remove this if you want to be able to use deprecated methods without causing script to stop.
// This is useful during development.
host.setShouldFailOnDeprecatedUse(true);

host.defineController("Roger Linn Design", "LinnstrumentLooping", "0.1", "e72dbb9b-ba1c-405e-998e-6a96dee48830", "OliverLSanz");

host.defineMidiPorts(1, 1);

let tracks: API.TrackBank
let transport: API.Transport

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
   host.getMidiInPort(0).setMidiCallback(onMidi0);

   // Channel 0: Used to control bitwig
   // Channels 1-15: Used for MPE
   const noteIn = host.getMidiInPort(0)
      .createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????",
         "?5????", "?6????", "?7????", "?8????", "?9????", "?A????",
         "?B????", "?C????", "?D????", "?E????", "?F????")
      .setUseExpressiveMidi(true, 0, 48);

   initLights()

   // TODO: Perform further initialization here.
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
   setLight({ row: 1, column: 1, color: "off" })
   setLight({ row: 1, column: 2, color: "off" })
   setLight({ row: 1, column: 3, color: "off" })
   setLight({ row: 1, column: 4, color: "off" })
   setLight({ row: 1, column: 5, color: "off" })
}

function armOneTrack(trackBank: API.TrackBank, trackIndex: number) {
   const bankSize = trackBank.getSizeOfBank()

   for(let i = 0; i < bankSize; i++) {
      trackBank.getItemAt(i).arm().set(trackIndex === i)
      setLight({ row: 0, column: i, color: trackIndex === i ? "red" : "off" })
   }
}

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

// Called when a short MIDI message is received on MIDI input port 0.
function onMidi0 (status: number, data1: number, data2: number){
   // TODO: Implement your MIDI input handling code here.

   const type = status >> 4
   const channel = status % 16

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
}

function flush() {
   // TODO: Flush any output to your controller here.
}

function exit() {

}