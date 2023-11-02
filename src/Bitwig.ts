namespace L {
  /**
   * Class used to interact with the Bitwig API
   *
   * The host, transport, tracks and application attributes allow dirty direct control of bitwig.
   * But the class also presents some nice helper methods to do some things more easily.
   */
  export class Bitwig {
    host: API.ControllerHost;
    transport: API.Transport;
    tracks: API.TrackBank;
    application: API.Application;

    constructor(host: API.ControllerHost) {
      this.host = host;
      this.transport = host.createTransport();
      this.tracks = host.createMainTrackBank(15, 0, 8);
      this.application = host.createApplication();
    }

    armTrack(trackIndex: number) {
      const bankSize = this.tracks.getSizeOfBank();

      for (let i = 0; i < bankSize; i++) {
        this.tracks
          .getItemAt(i)
          .arm()
          .set(trackIndex === i);
      }

      const selectedTrack = this.tracks.getItemAt(trackIndex);
      selectedTrack.selectInEditor();
      selectedTrack.selectInMixer();
      selectedTrack.makeVisibleInArranger();
      selectedTrack.makeVisibleInMixer();
    }

    midiOut({ type, channel, data1, data2 }: MidiMessage) {
      const status = type << (4 + channel);
      this.host.getMidiOutPort(0).sendMidi(status, data1, data2);
    }
  }
}
