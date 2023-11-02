// Types and constants used accross the project.

namespace _ {
  export interface MidiMessage {
    type: number;
    channel: number;
    data1: number;
    data2: number;
  }

  export type lightColor =
    | "default"
    | "red"
    | "yellow"
    | "green"
    | "cyan"
    | "blue"
    | "magenta"
    | "off"
    | "white"
    | "orange"
    | "lime"
    | "pink";

  export const lightColorValues = {
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

  export type row = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  export type column = 0 | 1 | 2 | 3 | 4;
  export const rowIndexes: row[] = [0, 1, 2, 3, 4, 5, 6, 7];
  export const columnIndexes: column[] = [0, 1, 2, 3, 4];

  export const NOTE_OFF = 8;
  export const NOTE_ON = 9;
  export const CC = 11;

  export const MAX_MIDI_NOTE = 127;
}
