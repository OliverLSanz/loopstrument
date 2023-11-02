namespace L {
  interface LoopLengthOptions {
    row: number;
    column: number;
    onColor: lightColor;
    offColor: lightColor;
  }

  export class LoopLength extends ControllerModule {
    #options: LoopLengthOptions;
    #bars: number = 0;
    #nextBars: number = 0;
    #pressedButtons: [boolean, boolean, boolean, boolean, boolean] = [
      false,
      false,
      false,
      false,
      false,
    ];

    constructor(context: ModuleContext, options: LoopLengthOptions) {
      super(context);
      this.#options = options;
    }

    init() {
      this.addValueObserver(
        this.bitwig.transport.clipLauncherPostRecordingAction(),
        () => {
          this.updateLights();
        },
      );
      this.addValueObserver(
        this.bitwig.transport.getClipLauncherPostRecordingTimeOffset(),
        () => {
          this.updateLights();
        },
      );
      this.addValueObserver(
        this.bitwig.transport.timeSignature().numerator(),
        () => {
          this.setLoopLength();
        },
      );
      this.addValueObserver(
        this.bitwig.transport.timeSignature().denominator(),
        () => {
          this.setLoopLength();
        },
      );
    }

    setLoopLength(): void {
      const numberOfBars = this.#bars;
      const numerator = this.bitwig.transport.timeSignature().numerator().get();
      const denominator = this.bitwig.transport
        .timeSignature()
        .denominator()
        .get();
      this.bitwig.transport
        .clipLauncherPostRecordingAction()
        .set("play_recorded");
      this.bitwig.transport
        .getClipLauncherPostRecordingTimeOffset()
        .set((4 * numberOfBars * numerator) / denominator);
    }

    updateLights(): void {
      const postRecordingOffset = this.bitwig.transport
        .getClipLauncherPostRecordingTimeOffset()
        .get();
      const numerator = this.bitwig.transport.timeSignature().numerator().get();
      const denominator = this.bitwig.transport
        .timeSignature()
        .denominator()
        .get();
      const numberOfBars = (postRecordingOffset / 4 / numerator) * denominator;

      const light1 = numberOfBars % 2;
      const light2 = (numberOfBars >> 1) % 2;
      const light3 = (numberOfBars >> 2) % 2;
      const light4 = (numberOfBars >> 3) % 2;
      const light5 = (numberOfBars >> 4) % 2;

      this.controller.setLight({
        row: this.#options.row as row,
        column: this.#options.column as column,
        color: light1 ? this.#options.onColor : this.#options.offColor,
      });
      this.controller.setLight({
        row: this.#options.row as row,
        column: (this.#options.column + 1) as column,
        color: light2 ? this.#options.onColor : this.#options.offColor,
      });
      this.controller.setLight({
        row: this.#options.row as row,
        column: (this.#options.column + 2) as column,
        color: light3 ? this.#options.onColor : this.#options.offColor,
      });
      this.controller.setLight({
        row: this.#options.row as row,
        column: (this.#options.column + 3) as column,
        color: light4 ? this.#options.onColor : this.#options.offColor,
      });
      this.controller.setLight({
        row: this.#options.row as row,
        column: (this.#options.column + 4) as column,
        color: light5 ? this.#options.onColor : this.#options.offColor,
      });
    }

    handleMidi(midi: MidiMessage): boolean {
      const baseNote = this.controller.coordinateToControlSplitButton({
        row: this.#options.row,
        column: this.#options.column,
      });
      const receivedNote = midi.data1;
      const button = receivedNote - baseNote;

      if (button < 0 || button > 4) {
        return false;
      }

      if (midi.type === NOTE_OFF) {
        this.#pressedButtons[button] = false;

        if (this.#pressedButtons.every((button) => button === false)) {
          // Interaction ended

          if (this.#bars == this.#nextBars) {
            // disable
            this.#bars = 0;
          } else {
            this.#bars = this.#nextBars;
          }
          this.#nextBars = 0;

          this.setLoopLength();
        }

        return true;
      }

      if (midi.type === NOTE_ON) {
        this.#pressedButtons[button] = true;
        this.#nextBars += 1 << button;

        return true;
      }

      return false;
    }
  }
}
