namespace _ {
  interface MetronomeOptions {
    row: number;
    column: number;
    onColor: lightColor;
    offColor: lightColor;
  }

  export class Metronome extends ControllerModule {
    #options: MetronomeOptions;

    constructor(context: ModuleContext, options: MetronomeOptions) {
      super(context);
      this.#options = options;
    }

    init(): void {
      this.addValueObserver(this.bitwig.transport.isMetronomeEnabled(), () => {
        const metronomeEnabled = this.bitwig.transport
          .isMetronomeEnabled()
          .get();
        this.controller.setLight({
          row: this.#options.row as row,
          column: this.#options.column as column,
          color: metronomeEnabled
            ? this.#options.onColor
            : this.#options.offColor,
        });
      });
    }

    #onTap() {
      this.bitwig.transport.tapTempo();
    }

    #onLongPress() {
      this.bitwig.transport.isMetronomeEnabled().toggle();
    }

    handleMidi(midi: MidiMessage): boolean {
      const button = this.controller.coordinateToControlSplitButton({
        row: this.#options.row,
        column: this.#options.column,
      });

      if (midi.type === NOTE_ON && midi.data1 === button) {
        this.pressHandler.handlePressBegin(
          () => this.#onTap(),
          () => this.#onLongPress(),
          midi.data1,
        );
        return true;
      }

      if (midi.type === NOTE_OFF && midi.data1 === button) {
        this.pressHandler.handlePressEnd(midi.data1);
        return true;
      }

      return false;
    }
  }
}
