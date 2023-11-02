namespace _ {
  interface ClipArrayOptions {
    row: number;
    column: number;
    numberOfTracks: number;
    firstTrackIndex: number;
    clipsPerTrack: number;
    recordingColor: lightColor;
    playingColor: lightColor;
    pausedColor: lightColor;
    emptyColor: lightColor;
  }

  export class ClipArray extends ClipControllerModule {
    #options: ClipArrayOptions;

    constructor(context: ModuleContext, options: ClipArrayOptions) {
      super(context);
      this.#options = options;
    }

    init(): void {
      // Start observers
      this.addClipValueObservers(
        this.#options.numberOfTracks,
        this.#options.firstTrackIndex,
        this.#options.clipsPerTrack,
      );
    }

    handleMidi(midi: MidiMessage): boolean {
      const { row, column } = this.controller.controlSplitButtonToCoordinate(
        midi.data1,
      );

      if (
        row >= this.#options.row &&
        row < this.#options.row + this.#options.clipsPerTrack &&
        column >= this.#options.column &&
        column < this.#options.column + this.#options.numberOfTracks
      ) {
        if (midi.type === NOTE_ON) {
          const trackIndex = column - this.#options.column;
          const clipIndex = row - this.#options.row;

          const [onTap, onLongPress] = this.getClipPressedCallbacks(
            trackIndex,
            clipIndex,
            this.#options.firstTrackIndex,
            this.bitwig,
          );

          this.pressHandler.handlePressBegin(onTap, onLongPress, midi.data1);
        }

        if (midi.type === NOTE_OFF) {
          this.pressHandler.handlePressEnd(midi.data1);
        }
        return true;
      }

      return false;
    }

    updateClipLight(trackIndex: number, track: API.Track, clipIndex: number) {
      const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);

      if (clip.isRecording().getAsBoolean()) {
        this.controller.setLight({
          row: (this.#options.row + clipIndex) as row,
          column: (this.#options.column + trackIndex) as column,
          color: this.#options.recordingColor,
        });
        return;
      }
      if (clip.isPlaying().getAsBoolean()) {
        this.controller.setLight({
          row: (this.#options.row + clipIndex) as row,
          column: (this.#options.column + trackIndex) as column,
          color: this.#options.playingColor,
        });
        return;
      }
      if (clip.hasContent().getAsBoolean()) {
        this.controller.setLight({
          row: (this.#options.row + clipIndex) as row,
          column: (this.#options.column + trackIndex) as column,
          color: this.#options.pausedColor,
        });
        return;
      }
      // Clip is empty
      this.controller.setLight({
        row: (this.#options.row + clipIndex) as row,
        column: (this.#options.column + trackIndex) as column,
        color: this.#options.emptyColor,
      });
    }
  }
}
