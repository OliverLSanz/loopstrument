// This file defines a class to control the linnstrument more
// easily. All is done through the Bitwig interface.

namespace L {
  type Split = "left" | "right";

  export class LinnStrument {
    #bitwig: Bitwig;

    constructor(bitwig: Bitwig) {
      this.#bitwig = bitwig;
    }

    setLight({
      row,
      column,
      color,
    }: {
      row: row;
      column: number;
      color: lightColor;
    }) {
      // 20 is for select column to change color, 1 is first play column.
      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 20,
        data2: column + 1,
      });
      // 21 for select row. Top is 7.
      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 21,
        data2: Math.abs(row - 7),
      });
      // 22 to set color, 1 is red
      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 22,
        data2: lightColorValues[color],
      });
    }

    resetLights() {
      rowIndexes.forEach((row) => {
        columnIndexes.forEach((column) => {
          this.setLight({ row, column, color: "default" });
        });
      });
    }

    turnOffLights() {
      rowIndexes.forEach((row) => {
        columnIndexes.forEach((column) => {
          this.setLight({ row, column, color: "off" });
        });
      });
    }

    sendNRPN(number: number, value: number) {
      const MSBNumber = number >> 7;
      const LSBNumber = number % 128;
      const MSBValue = value >> 7;
      const LSBValue = value % 128;

      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 99,
        data2: MSBNumber,
      });
      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 98,
        data2: LSBNumber,
      });
      this.#bitwig.midiOut({ type: CC, channel: 0, data1: 6, data2: MSBValue });
      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 38,
        data2: LSBValue,
      });
      this.#bitwig.midiOut({ type: CC, channel: 0, data1: 101, data2: 127 });
      this.#bitwig.midiOut({ type: CC, channel: 0, data1: 100, data2: 127 });
      sleep(50);
    }

    setMidiMode(
      mode: "OneChannel" | "ChannelPerNote" | "ChannelPerRow",
      split: Split,
    ) {
      let value;
      if (mode == "OneChannel") {
        value = 0;
      } else if (mode == "ChannelPerNote") {
        value = 1;
      } else {
        value = 2;
      }

      this.sendNRPN(split == "left" ? 0 : 100, value);
    }

    /**
     *
     * @param value only supports, 0: No overlap, 3 4 5 6 7 12: Intervals, 13: Guitar, 127: 0 offset
     */
    setRowOffset(value: number) {
      this.sendNRPN(227, value);
    }

    /**
     *
     * @param channel From 0 to 15
     */
    setMidiMainChannel(channel: number, split: Split) {
      this.sendNRPN(split == "left" ? 1 : 101, channel + 1);
    }

    /**
     *
     * @param channel From 0 to 15
     * @param enabled
     */
    setMidiPerNoteChannel(channel: number, enabled: boolean, split: Split) {
      this.sendNRPN(
        split == "left" ? 2 + channel : 102 + channel,
        enabled ? 1 : 0,
      );
    }

    /**
     *
     * @param range From 1 to 96
     */
    setMidiBendRange(range: number, split: Split) {
      this.sendNRPN(split === "left" ? 19 : 119, range);
    }

    /**
     *
     * @param octaves 0-10, 5 is +0
     * @param semitones 0-14, 0-6: -7 to -1, 7: 0, 8-14: +1 to +7
     */
    setTransposition(octaves: number, semitones: number) {
      // Left Octave
      this.sendNRPN(36, octaves);
      // Left Pitch
      this.sendNRPN(37, semitones);
      // Right Octave
      this.sendNRPN(136, octaves);
      // Right Pitch
      this.sendNRPN(137, semitones);
    }

    setSplitActive(active: boolean) {
      this.sendNRPN(200, active ? 1 : 0);
    }

    /**
     *
     * @param column Start of second split: 2-25
     */
    setSplitPoint(column: number) {
      this.sendNRPN(202, column);
    }

    setSelectedSplit(split: Split) {
      this.sendNRPN(201, split == "left" ? 0 : 1);
    }

    setSplitMode(
      split: Split,
      mode: "default" | "arpeg" | "faders" | "strum" | "sequencer",
    ) {
      const values = {
        default: 0,
        arpeg: 1,
        faders: 2,
        strum: 3,
        sequencer: 4,
      };

      this.sendNRPN(split == "left" ? 35 : 135, values[mode]);
    }

    /**
     *
     * @param fader Index of the CC fader, from 0 to 7.
     * @param ccNumber CC number that the fader should send when used.
     */
    setCCFaderNumber(fader: number, ccNumber: number, split: Split) {
      this.sendNRPN((split == "left" ? 40 : 140) + fader, ccNumber);
    }

    // Below this line: unused and not tested
    setPitchQuantize(enabled: boolean, split: Split) {
      this.sendNRPN(split == "left" ? 21 : 121, enabled ? 1 : 0);
    }

    setPitchQuantizeHold(
      mode: "Off" | "Medium" | "Fast" | "Slow",
      split: Split,
    ) {
      const translation = {
        Off: 0,
        Medium: 1,
        Fast: 2,
        Slow: 3,
      };
      this.sendNRPN(split == "left" ? 22 : 122, translation[mode]);
    }

    setSendX(enabled: boolean, split: Split) {
      this.sendNRPN(split == "left" ? 20 : 120, enabled ? 1 : 0);
    }

    /**
     *
     * @param fader Index of the CC fader, from 0 to 7.
     * @param value
     */
    setCCFaderValue(fader: number, value: number) {
      this.#bitwig.midiOut({
        type: CC,
        channel: 0,
        data1: 1 + fader,
        data2: value,
      });
    }
  }
}
