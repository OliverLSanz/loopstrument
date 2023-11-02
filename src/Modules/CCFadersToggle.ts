namespace L {
  interface CCFadersToggleOptions {
    row: number;
    column: number;
    ccFadersWidth: number;
    lowerCC: 1;
    color: lightColor;
  }

  export class CCFadersToggle extends ControllerModule {
    #options: CCFadersToggleOptions;

    constructor(context: ModuleContext, options: CCFadersToggleOptions) {
      super(context);
      this.#options = options;
    }

    init(): void {
      this.addInitCallback(() => {
        this.controller.setLight({
          row: this.#options.row as row,
          column: this.#options.column as column,
          color: this.#options.color,
        });
      });
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

    #onTap() {
      this.controller.toggleCCSliders();
    }

    #onLongPress() {
      this.controller.setSlidersMode(
        this.controller.slidersMode == "hard" ? "soft" : "hard",
      );
    }
  }
}
