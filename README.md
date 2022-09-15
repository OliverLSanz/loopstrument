For the changes to take effect on the JS code:

```
yarn tsc --watch
```

# Linnstrument setup

Channel 0 is used to control bitwig

Rest of channels are used to play music.

## Left split

MIDI MODE: One Channel
MAIN CHANNEL: 1
PITCH/X: OFF
TIMBRE/Y: OFF
LOUDNESS/Z: OFF
WIDTH: 5 Columns
PLAYED COLOR: Off (no light)

## Right Split

MIDI MODE: Channel Per Note
PerNote Chan: all from 2 to 16
BEND RANGE: 48
PITCH: ON
TIMBRE: ON, CC74
LOUDNESS: ON, Channel Pres

## Global Settings

ROW OFFSET: +5
POWER/MIDI: USB

# Manual

## Change track

Use the 5 top buttons in the left split to change between the first 5 tracks
in bitwig. The leds will tell which track is currently engaged.

## Use Clips

The three rows bellow the track row are the clip launchers.

- Launch an empty clip with that track enabled to start recording (red light
will turn on).

- Press again to stop recording (white light will indicate that the clip has
content).

- Press any clip with content to launch it.

- Press again to stop it.

- Only one clip from each track can play at the same time.

- Long press on a clip to delete it.