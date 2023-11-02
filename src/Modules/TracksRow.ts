namespace L {
  interface TracksRowOptions {
    row: number;
    column: number;
    numberOfTracks: number;
    firstTrackIndex: number;
    armedTrackColor: lightColor;
    unarmedTrackColor: lightColor;
  }

  export class TracksRow extends ControllerModule {
    #options: TracksRowOptions;

    constructor(context: ModuleContext, options: TracksRowOptions) {
      super(context);
      this.#options = options;
    }

    init(): void {
      for (
        let trackIndex = 0;
        trackIndex < this.#options.numberOfTracks;
        trackIndex++
      ) {
        const track = this.bitwig.tracks.getItemAt(
          trackIndex + this.#options.firstTrackIndex,
        );

        this.addValueObserver(track.arm(), () => {
          const isArmed = track.arm().get();
          this.controller.setLight({
            row: this.#options.row as row,
            column: (this.#options.column + trackIndex) as column,
            color: isArmed
              ? this.#options.armedTrackColor
              : this.#options.unarmedTrackColor,
          });
        });
      }
    }

    handleMidi(midi: MidiMessage): boolean {
      // SWITCH TRACKS
      const baseButton = this.controller.coordinateToControlSplitButton({
        row: this.#options.row,
        column: this.#options.column,
      });

      for (
        let trackIndex = 0;
        trackIndex < this.#options.numberOfTracks;
        trackIndex++
      ) {
        if (midi.type === NOTE_ON && midi.data1 === baseButton + trackIndex) {
          this.bitwig.armTrack(trackIndex + this.#options.firstTrackIndex);
          return true;
        }
      }

      return false;
    }
  }
}
