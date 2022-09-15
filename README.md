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