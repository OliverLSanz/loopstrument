//  _______  _______  ______    ___   _______  _______
  // |       ||       ||    _ |  |   | |       ||       |
  // |  _____||       ||   | ||  |   | |    _  ||_     _|
  // | |_____ |       ||   |_||_ |   | |   |_| |  |   |
  // |_____  ||      _||    __  ||   | |    ___|  |   |
  //  _____| ||     |_ |   |  | ||   | |   |      |   |
  // |_______||_______||___|  |_||___| |___|      |___|

  // Creates objects, injects dependencies, and does some setup

  loadAPI(17);

  host.setShouldFailOnDeprecatedUse(true);
  host.defineController("Roger Linn Design", "LinnstrumentLooping", "0.1", "e72dbb9b-ba1c-405e-998e-6a96dee48830", "OliverLSanz");
  host.defineMidiPorts(1, 1);

function init() {
  const taskManager = new L.TaskManager(host)
  const pressHandler = new L.PressHandler(taskManager)

  const bitwig = new L.Bitwig(host)
  const linn = new L.LinnStrument(bitwig)

  const controllerOptions: L.ControllerOptions = {
    ccSlidersWidth: 2,
    interfaceWidth: 5,
  }

  const controller = new L.LiveLoopingController(bitwig, pressHandler, linn, controllerOptions)

  const context: L.ModuleContext = {
    bitwig: bitwig,
    pressHandler: pressHandler,
    linnstrument: linn,
    controller: controller
  }

  const defaultModules: L.ControllerModule[] = [
    // new Debug(context),
    new L.TracksRow(context, {row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5, armedTrackColor: "magenta", unarmedTrackColor: "off"}),
    new L.ClipArray(context, {row: 1, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: 'red', playingColor: "orange", pausedColor: "white", emptyColor: "blue"}),
    new L.LoopLength(context, {row: 6, column: 0, offColor: 'off', onColor: 'orange'}),
    // low-light option
    // new ClipArray(context, {row: 1, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: "red", playingColor: "blue", pausedColor: "white", emptyColor: "off"}),
    // new LoopLength(context, {row: 6, column: 0, offColor: 'off', onColor: 'blue'}),
    new L.UndoRedo(context, {row: 7, column: 2, color: 'magenta'}),
    new L.OverdubToggle(context, {row: 7, column: 0, offColor: 'white', onColor: 'red'}),
    new L.InterfaceToggle(context, {row: 7, column: 4, color: "yellow"}),
    new L.CCFadersToggle(context, {row: 7, column: 3, ccFadersWidth: 2, lowerCC: 1, color: 'green'}),
    new L.Metronome(context, {row: 7, column: 1, onColor: 'orange', offColor: 'white'}),
    new L.ClipArray(context, {row: 5, column: 0, firstTrackIndex: 5, numberOfTracks: 5, clipsPerTrack: 1, recordingColor: "red", playingColor: "green", pausedColor: "white", emptyColor: "cyan"})
    // new ClipArray(context, {row: 5, column: 0, firstTrackIndex: 5, numberOfTracks: 5, clipsPerTrack: 1, recordingColor: "red", playingColor: "blue", pausedColor: "white", emptyColor: "off"})
  ]

  const collapsedInterfaceModules: L.ControllerModule[] = [
    // new Debug(context),
    new L.FollowerClipColumn(context, {row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: 'red', playingColor: "orange", pausedColor: "white", emptyColor: "blue"}),
    // new FollowerClipColumn(context, {row: 0, column: 0, firstTrackIndex: 0, numberOfTracks: 5, clipsPerTrack: 4, recordingColor: "red", playingColor: "blue", pausedColor: "white", emptyColor: "off" }),
    new L.OverdubToggle(context, {row: 4, column: 0, offColor: 'white', onColor: 'red'}),
    new L.UndoRedo(context, {row: 5, column: 0, color: "magenta"}),
    new L.CCFadersToggle(context, {row: 6, column: 0, ccFadersWidth: 2, lowerCC: 1, color: 'green'}),
    new L.InterfaceToggle(context, {row: 7, column: 0, color: "yellow"}),
  ]

  controller.addModules("default", defaultModules)
  controller.addModules("collapsedInterface", collapsedInterfaceModules)
  controller.start()

  println("LinnstrumentLooping initialized!");
}


function flush() {
  // Flush any output to your controller here.
}

function exit() {
  // This gets called on exit
}