namespace L {
  interface InterfaceToggleOptions {
    row: number;
    column: number;
    color: lightColor;
  }

  export class InterfaceToggle extends ControllerModule {
    #options: InterfaceToggleOptions;

    constructor(context: ModuleContext, options: InterfaceToggleOptions) {
      super(context);
      this.#options = options;
    }

    init(): void {
      this.addInitCallback(() => {
        this.controller.setLight({
          row: this.#options.row as row,
          column: this.#options.column as column,
          color: this.#options.color,
          force: true,
        });
      });
    }

    handleMidi(midi: MidiMessage): boolean {
      const button = this.controller.coordinateToControlSplitButton({
        row: this.#options.row,
        column: this.#options.column,
      });

      if (midi.type === NOTE_ON && midi.data1 === button) {
        if (this.controller.getMode() === "default") {
          this.controller.setMode("collapsedInterface");
        } else {
          this.controller.setMode("default");
        }
        return true;
      }
      return false;
    }
  }
}
