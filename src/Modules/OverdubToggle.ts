namespace L {
  interface OverdubToggleOptions {
    row: number;
    column: number;
    onColor: lightColor;
    offColor: lightColor;
  }

  export class OverdubToggle extends ControllerModule {
    #options: OverdubToggleOptions;

    constructor(context: ModuleContext, options: OverdubToggleOptions) {
      super(context);
      this.#options = options;
    }

    init(): void {
      this.addValueObserver(
        this.bitwig.transport.isClipLauncherOverdubEnabled(),
        () => {
          const isOverdubEnabled = this.bitwig.transport
            .isClipLauncherOverdubEnabled()
            .get();
          this.controller.setLight({
            row: this.#options.row as row,
            column: this.#options.column as column,
            color: isOverdubEnabled
              ? this.#options.onColor
              : this.#options.offColor,
          });
        },
      );
    }

    handleMidi(midi: MidiMessage): boolean {
      const buttonNote = this.controller.coordinateToControlSplitButton({
        row: this.#options.row,
        column: this.#options.column,
      });

      if (midi.type === NOTE_ON && midi.data1 === buttonNote) {
        const overdubEnabled = this.bitwig.transport
          .isClipLauncherOverdubEnabled()
          .getAsBoolean();
        this.bitwig.transport
          .isClipLauncherOverdubEnabled()
          .set(!overdubEnabled);
        return true;
      }
      return false;
    }
  }
}
