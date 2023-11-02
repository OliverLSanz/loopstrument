namespace _ {
  interface FollowerClipColumnOptions {
    row: number;
    column: number;
    clipsPerTrack: number;
    firstTrackIndex: number;
    numberOfTracks: number; // Number of tracks to keep track of
    recordingColor: lightColor;
    playingColor: lightColor;
    pausedColor: lightColor;
    emptyColor: lightColor;
  }

  export class FollowerClipColumn extends ClipControllerModule {
    #options: FollowerClipColumnOptions;
    #currentTrackIndex: number = 0;

    constructor(context: ModuleContext, options: FollowerClipColumnOptions) {
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
          if (isArmed) {
            this.#currentTrackIndex = trackIndex;
            for (
              let clipIndex = 0;
              clipIndex < this.#options.clipsPerTrack;
              clipIndex++
            ) {
              this.updateClipLight(trackIndex, track, clipIndex);
            }
          }
        });
      }

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
        column == this.#options.column
      ) {
        if (midi.type === NOTE_ON) {
          const trackIndex = this.#currentTrackIndex;
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

      if (this.#currentTrackIndex !== trackIndex) {
        return;
      }

      if (clip.isRecording().getAsBoolean()) {
        this.controller.setLight({
          row: (this.#options.row + clipIndex) as row,
          column: this.#options.column as column,
          color: this.#options.recordingColor,
        });
        return;
      }
      if (clip.isPlaying().getAsBoolean()) {
        this.controller.setLight({
          row: (this.#options.row + clipIndex) as row,
          column: this.#options.column as column,
          color: this.#options.playingColor,
        });
        return;
      }
      if (clip.hasContent().getAsBoolean()) {
        this.controller.setLight({
          row: (this.#options.row + clipIndex) as row,
          column: this.#options.column as column,
          color: this.#options.pausedColor,
        });
        return;
      }
      // Clip is empty
      this.controller.setLight({
        row: (this.#options.row + clipIndex) as row,
        column: this.#options.column as column,
        color: this.#options.emptyColor,
      });
    }
  }
}
