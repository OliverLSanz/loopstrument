/*
This is the entry point of the controller script. It defines the functions that Bitwig looks for when running the script.


*/

loadAPI(17);

host.setShouldFailOnDeprecatedUse(true);
host.defineController(
  "Roger Linn Design",
  "LinnstrumentLooping",
  "0.1",
  "e72dbb9b-ba1c-405e-998e-6a96dee48830",
  "OliverLSanz",
);
host.defineMidiPorts(1, 1);

function init() {
  const taskManager = new L.TaskManager(host);
  const pressHandler = new L.PressHandler(taskManager);
  const bitwig = new L.Bitwig(host);
  const linn = new L.LinnStrument(bitwig);

  const controllerOptions: L.ControllerOptions = {
    ccSlidersWidth: 2,
    interfaceWidth: 5,
  };

  // init the controler with all the pieces it needs to work
  const controller = new L.LiveLoopingController(
    bitwig,
    pressHandler,
    linn,
    controllerOptions,
  );

  // define context to be passed to each module
  const context: L.ModuleContext = {
    bitwig: bitwig,
    pressHandler: pressHandler,
    linnstrument: linn,
    controller: controller,
  };

  // here you can change the layout and modules for the default mode (aka not collapsed interface).
  // each item of the list is a module that will be added to the controller.
  // each module parameters defines it's behavior and location.
  const defaultModules: L.ControllerModule[] = [
    // uncomment this to print incoming midi messages to the Bitwig Console
    // new Debug(context),
    new L.TracksRow(context, {
      row: 0,
      column: 0,
      firstTrackIndex: 0,
      numberOfTracks: 5,
      armedTrackColor: "magenta",
      unarmedTrackColor: "off",
    }),
    new L.ClipArray(context, {
      row: 1,
      column: 0,
      firstTrackIndex: 0,
      numberOfTracks: 5,
      clipsPerTrack: 4,
      recordingColor: "red",
      playingColor: "orange",
      pausedColor: "white",
      emptyColor: "blue",
    }),
    new L.LoopLength(context, {
      row: 6,
      column: 0,
      offColor: "off",
      onColor: "orange",
    }),
    new L.UndoRedo(context, { row: 7, column: 2, color: "magenta" }),
    new L.OverdubToggle(context, {
      row: 7,
      column: 0,
      offColor: "white",
      onColor: "red",
    }),
    new L.InterfaceToggle(context, { row: 7, column: 4, color: "yellow" }),
    new L.CCFadersToggle(context, {
      row: 7,
      column: 3,
      ccFadersWidth: 2,
      lowerCC: 1,
      color: "green",
    }),
    new L.Metronome(context, {
      row: 7,
      column: 1,
      onColor: "orange",
      offColor: "white",
    }),
    new L.ClipArray(context, {
      row: 5,
      column: 0,
      firstTrackIndex: 5,
      numberOfTracks: 5,
      clipsPerTrack: 1,
      recordingColor: "red",
      playingColor: "green",
      pausedColor: "white",
      emptyColor: "cyan",
    }),
  ];

  // here you can change the layout and modules for the collapsed interface mode
  const collapsedInterfaceModules: L.ControllerModule[] = [
    // uncomment this to print incoming midi messages to the Bitwig Console
    // new Debug(context),
    new L.FollowerClipColumn(context, {
      row: 0,
      column: 0,
      firstTrackIndex: 0,
      numberOfTracks: 5,
      clipsPerTrack: 4,
      recordingColor: "red",
      playingColor: "orange",
      pausedColor: "white",
      emptyColor: "blue",
    }),
    new L.OverdubToggle(context, {
      row: 4,
      column: 0,
      offColor: "white",
      onColor: "red",
    }),
    new L.UndoRedo(context, { row: 5, column: 0, color: "magenta" }),
    new L.CCFadersToggle(context, {
      row: 6,
      column: 0,
      ccFadersWidth: 2,
      lowerCC: 1,
      color: "green",
    }),
    new L.InterfaceToggle(context, { row: 7, column: 0, color: "yellow" }),
  ];

  // add modules for the default mode
  controller.addModules("default", defaultModules);
  // add modules for the collapsed interface mode
  controller.addModules("collapsedInterface", collapsedInterfaceModules);
  // initialize the controller and all its modules
  controller.start();

  println("LinnstrumentLooping initialized!");
}

function flush() {
  // flush any output to the controller here.
}

function exit() {
  // this gets called on exit
}
