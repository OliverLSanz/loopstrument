namespace _ {
  /**
   * Base functionality to control clips
   */
  export class ClipControllerModule extends ControllerModule {
    addClipValueObservers(
      numberOfTracks: number,
      firstTrackIndex: number,
      clipsPerTrack: number,
    ) {
      for (let trackIndex = 0; trackIndex < numberOfTracks; trackIndex++) {
        const track = this.bitwig.tracks.getItemAt(
          trackIndex + firstTrackIndex,
        );
        track.arm().markInterested();

        for (let clipIndex = 0; clipIndex < clipsPerTrack; clipIndex++) {
          const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);

          this.addValueObserver(clip.isPlaying(), () => {
            this.updateClipLight(trackIndex, track, clipIndex);
          });
          this.addValueObserver(clip.isPlaying(), () => {
            this.updateClipLight(trackIndex, track, clipIndex);
          });
          this.addValueObserver(clip.isRecording(), () => {
            this.updateClipLight(trackIndex, track, clipIndex);
          });
          this.addValueObserver(clip.hasContent(), () => {
            this.updateClipLight(trackIndex, track, clipIndex);
          });
        }
      }
    }

    updateClipLight(trackIndex: number, track: API.Track, clipIndex: number) {}

    getClipPressedCallbacks(
      trackIndex: number,
      clipIndex: number,
      firstTrackIndex: number,
      bitwig: Bitwig,
    ): [() => void, () => void] {
      const track = bitwig.tracks.getItemAt(trackIndex + firstTrackIndex);
      const clip = track.clipLauncherSlotBank().getItemAt(clipIndex);

      function onTap() {
        if (!clip.hasContent().getAsBoolean() && !track.arm().get()) {
          bitwig.armTrack(trackIndex + firstTrackIndex);
        }
        if (clip.isPlaying().getAsBoolean()) {
          track.stop();
        } else {
          clip.launch();
        }
      }

      function onLongPress() {
        clip.deleteObject();
      }

      return [onTap, onLongPress];
    }
  }
}
