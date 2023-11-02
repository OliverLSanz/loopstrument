namespace _ {
  interface UndoRedoOptions {
    row: number;
    column: number;
    color: lightColor;
  }

  export class UndoRedo extends ControllerModule {
    #options: UndoRedoOptions;

    constructor(context: ModuleContext, options: UndoRedoOptions) {
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
      const buttonNote = this.controller.coordinateToControlSplitButton({
        row: this.#options.row,
        column: this.#options.column,
      });

      if (midi.type === NOTE_ON && midi.data1 === buttonNote) {
        this.pressHandler.handlePressBegin(
          () => this.bitwig.application.undo(),
          () => this.bitwig.application.redo(),
          midi.data1,
        );
        return true;
      }

      if (midi.type === NOTE_OFF && midi.data1 === buttonNote) {
        this.pressHandler.handlePressEnd(midi.data1);
        return true;
      }

      return false;
    }
  }
}
