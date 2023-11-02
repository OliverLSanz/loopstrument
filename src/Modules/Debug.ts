namespace _ {
  export class Debug extends ControllerModule {
    init(): void {}

    handleMidi(midi: MidiMessage): boolean {
      let message = "";
      const Y_CC = 74;
      if (midi.type == NOTE_ON) {
        message += "   NOTE ON ";
      } else if (midi.type == NOTE_OFF) {
        message += "  NOTE OFF ";
      } else if (midi.type == CC && midi.data1 == Y_CC) {
        message += "      Y CC ";
      } else if (midi.type == CC) {
        message += "        CC ";
      } else {
        message += "           ";
      }
      message += `CH ${midi.channel} TY ${midi.type} D1 ${midi.data1} D2 ${midi.data2}`;
      println(message);
      return false;
    }
  }
}
