//  _______  _______  __    _  _______  ______    _______  ___      ___      _______  ______
// |       ||       ||  |  | ||       ||    _ |  |       ||   |    |   |    |       ||    _ |
// |       ||   _   ||   |_| ||_     _||   | ||  |   _   ||   |    |   |    |    ___||   | ||
// |       ||  | |  ||       |  |   |  |   |_||_ |  | |  ||   |    |   |    |   |___ |   |_||_
// |      _||  |_|  ||  _    |  |   |  |    __  ||  |_|  ||   |___ |   |___ |    ___||    __  |
// |     |_ |       || | |   |  |   |  |   |  | ||       ||       ||       ||   |___ |   |  | |
// |_______||_______||_|  |__|  |___|  |___|  |_||_______||_______||_______||_______||___|  |_|

namespace L {
  export interface ControllerOptions {
    // Width of the CC sliders left split
    ccSlidersWidth: number,
    // The number of columns at the left of the split that
    // should be reserved for the control interface.
    interfaceWidth: number,
  }

  export class LiveLoopingController {
    bitwig: Bitwig
    pressHandler: PressHandler
    #keyTranslationTable: number[]
    #noteInput: API.NoteInput
    #currentMode: string = "default"
    ccSlidersEnabled: boolean = false
    slidersMode: "soft" | "hard" = "soft"
    #linn: LinnStrument
    linn: LinnStrument
    #modules: {[mode: string]: ControllerModule[]}

    #options: ControllerOptions

    #width = 16
    #height = 8
    #noteOffset = 30  // note played by the lowest key in the play area
    #rowOffset = 6  // distance in semitomes while going 1 row up
    #noteColors: lightColor[] = ['orange', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off', 'off']
    #firstControlAreaButton = 0

    constructor(bitwig: Bitwig, pressHandler: PressHandler, linnstrument: LinnStrument, options: ControllerOptions){
      this.bitwig = bitwig
      this.pressHandler = pressHandler
      this.#linn = linnstrument
      this.linn = linnstrument
      this.#options = options
      this.#modules = {default: []}
      this.#keyTranslationTable = []

      this.#noteInput = this.bitwig.host.getMidiInPort(0).createNoteInput("LinnStrument", "?1????", "?2????", "?3????", "?4????", "?5????", "?6????", "?7????", "?8????", "?9????", "?A????", "?B????", "?C????", "?D????", "?E????", "?F????")
      this.#noteInput.setUseExpressiveMidi(true, 0, 24);

      // Configure CC sliders to control remote control page of selected device
      const cursorTrack = host.createCursorTrack("LINNSTRUMENT_CURSOR_TRACK", "Cursor Track", 0, 0, true);
      const cursorDevice = cursorTrack.createCursorDevice();
      const remoteControlsPage = cursorDevice.createCursorRemoteControlsPage(8)
      const hardwareSurface = bitwig.host.createHardwareSurface()
      for (let i = 0; i < remoteControlsPage.getParameterCount(); i++){
        remoteControlsPage.getParameter(i).setIndication(true);
        const knob = hardwareSurface.createAbsoluteHardwareKnob("knob"+i)
        const absoluteCCValueMatcher = this.bitwig.host.getMidiInPort(0).createAbsoluteCCValueMatcher(0,8-i);
        knob.setAdjustValueMatcher(absoluteCCValueMatcher)
        knob.disableTakeOver()
        remoteControlsPage.getParameter(i).addBinding(knob)
      }
    }

    addModules(mode: string, modules: ControllerModule[]): void {
      if(this.#modules[mode] === undefined){
        this.#modules[mode] = []
      }
      this.#modules[mode] = this.#modules[mode].concat(modules)
    }

    start(){
      this.#setupBitwigPreferencesPannel()

      this.bitwig.host.getMidiInPort(0).setMidiCallback((...args) => this.handleMidi(...args));
      this.bitwig.host.getMidiInPort(0)
      this.#configureLinnstrument()
      this.#modules["default"].forEach(module => module.enable())
      Object.keys(this.#modules).forEach(mode => {
        this.#modules[mode].forEach(module => {
          module.init()
        })
      })
      this.#update()
    }

    #setupBitwigPreferencesPannel(){
      const preferences = this.bitwig.host.getPreferences()

      const rowOffsetSettings: {[key: string]: number} = {
        '+3': 3,
        '+4': 4,
        '+5': 5,
        '+6': 6,
        '+7': 7,
        'OCTAVE': 8
      }
      preferences.getEnumSetting('Row Offset', 'Row Offset', Object.keys(rowOffsetSettings), '+5').addValueObserver(chosenOption => {
        if(this.#rowOffset !== rowOffsetSettings[chosenOption] ?? 5){
          this.#rowOffset = rowOffsetSettings[chosenOption] ?? 5
          this.#update()
        }
      })

      const noteIndexes: {[key: string]: number} = {
        'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8,  'A': 9, 'A#': 10, 'B': 11,
      }
      for(const noteName in noteIndexes){
        preferences.getEnumSetting(noteName, 'Note Colors', Object.keys(lightColorValues), noteIndexes[noteName] == 0 ? 'orange' : 'off').addValueObserver(chosenColor => {
          if(this.#noteColors[noteIndexes[noteName]] !== chosenColor as lightColor){
            this.#noteColors[noteIndexes[noteName]] = chosenColor as lightColor
            this.#update()
          }
        })
      }
    }

    #configureLinnstrument() {
      // Global settings
      this.#linn.setRowOffset(0)
      this.#linn.setTransposition(3, 1)
      this.#linn.setSelectedSplit("right")
      this.#linn.setSplitActive(this.ccSlidersEnabled)
      this.#linn.setSplitPoint(this.#getLeftSplitWidth()+1)
      
      // Left split
      this.#linn.setMidiBendRange(24, 'left')
      this.#linn.setMidiMode("OneChannel", 'left')
      this.#linn.setMidiMainChannel(0, 'left')
      this.#linn.setSplitMode('left', 'faders')
      for(let i = 0; i < 8; i++){
        this.#linn.setCCFaderNumber(i, i+1, 'left')
      }
      
      // Right split
      this.#linn.setMidiBendRange(24, 'right')
      this.#linn.setMidiMode("ChannelPerNote", 'right')
      this.#linn.setSplitMode('right', 'default')
      Array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15).forEach(i => {
        this.#linn.setMidiPerNoteChannel(i, true, 'right')
      })
    }

    #getPlayAreaWidth(){
      return this.#width - this.#getLeftSplitWidth()
    }

    #getLeftSplitWidth(){
      return this.ccSlidersEnabled? this.#options.ccSlidersWidth : 0
    }

    coordinateToControlSplitButton({row, column}: {row: number, column: number}): number {
      return this.#firstControlAreaButton + (7-row)*this.#getPlayAreaWidth() + column
    }

    controlSplitButtonToCoordinate(button: number): { row: number, column: number } {
      const row = 7 - Math.floor((button - this.#firstControlAreaButton) / this.#getPlayAreaWidth())
      const column = button % this.#getPlayAreaWidth()
      return { row, column } 
    } 

    #buttonToNote(buttonIndex: number): number{
      // This ensures the same notes are played by the same buttons
      // regardless of the interface state
      const interfaceOffset = this.#getLeftSplitWidth()

      const rowDecrement = this.#getPlayAreaWidth() - this.#rowOffset

      const currentRow = Math.floor((buttonIndex)/this.#getPlayAreaWidth())
      const rowAdjustment = currentRow*rowDecrement
      const note = buttonIndex - rowAdjustment + this.#noteOffset + interfaceOffset

      return note
    }

    #setPlayAreaLights(){
      for(let row = 0; row < this.#height; row++){
        for(let column = 0; column < this.#width; column++){
          if(column >= 0){
            const playAreaButton = row * this.#getPlayAreaWidth() + column
            const note = this.#buttonToNote(playAreaButton) % 12
            const color = this.#noteColors[note]
            this.setLight({row: 7-row as row, column: column as column, color, force: true})
          }else{
            this.setLight({row: 7-row as row, column: column as column, color: "off", force: true})
          }
        }
      }
    }

    setButtonLight(button: number, color: lightColor, force?: boolean){
      const buttonOffset = 0  // number of the first button
      const buttonsPerRow = 16
      const row = Math.floor((button - buttonOffset)/buttonsPerRow)
      const column = button - row*buttonsPerRow
      this.setLight({row: 7 - row as row, column: column as column, color, force})
    }

    handleMidi(status: number, data1: number, data2: number){
      const type = status >> 4
      const channel = status % 16

      // Pass the midi message to each module.handleMidi until one returns true
      this.#modules[this.#currentMode].some(module => module.handleMidi({type, channel, data1, data2}))
    }

    private isInterfaceButton(buttonIndex: number){
      const interfaceWidth = this.#options.interfaceWidth
      if(this.#currentMode === "default"){
        return buttonIndex % this.#getPlayAreaWidth() < interfaceWidth
      }else{
        return buttonIndex % this.#getPlayAreaWidth() < 1
      }
    }

    #updateKeyTranslationTable(){
      const newTranslationTable = []
      for(let key = 0; key <= MAX_MIDI_NOTE; key++){
        if(this.isInterfaceButton(key)){
          newTranslationTable.push(-1)
        }else{
          newTranslationTable.push(this.#buttonToNote(key))
        }
      }
      this.#keyTranslationTable = newTranslationTable
      this.#noteInput.setKeyTranslationTable(this.#keyTranslationTable)
    }

    getMode(){
      return this.#currentMode
    }

    setMode(mode: string){
      this.#modules[this.getMode()].forEach(module => module.disable())
      this.#currentMode = mode
      this.#modules[this.getMode()].forEach(module => module.enable())
      this.#update()
    }

    toggleCCSliders(){
      this.ccSlidersEnabled = !this.ccSlidersEnabled
      this.#linn.setSelectedSplit("right")
      this.#linn.setSplitActive(this.ccSlidersEnabled)
      this.#linn.setSplitPoint(this.#getLeftSplitWidth()+1)
      this.#update()
    }

    #update(){
      this.#updateKeyTranslationTable()

      if(this.#currentMode == "default"){
        this.#linn.turnOffLights()
      } else {
        this.#linn.resetLights()
      }

      this.#setPlayAreaLights()
      this.#modules[this.#currentMode].forEach(module => module.update())

      // Color the CC sliders matching bitwig remote control page
      // knob colors.
      if(this.ccSlidersEnabled){
        const softColors: lightColor[] = ['red', 'orange', 'yellow', 'green', 'lime', 'cyan', 'pink', 'magenta']
        const hardColors: lightColor[] = ['white', 'cyan', 'white', 'cyan', 'white', 'cyan', 'white', 'cyan']
        const sliderColors = {
          'soft': softColors,
          'hard': hardColors
        }

        for(let i = 0; i < 8; i++){
          this.#linn.setLight({row: i as row, column: 0, color: sliderColors[this.slidersMode][i]})
          this.#linn.setLight({row: i as row, column: 1, color: sliderColors[this.slidersMode][i]})
        }
      }
    }

    setSlidersMode(mode: 'soft' | 'hard'){
      this.slidersMode = mode
      for(let i = 0; i < 8; i++){
        this.#linn.setCCFaderNumber(i, (mode=="soft"?0:8)+i+1, 'left')
      }
      this.#update()
    }

    setLight(options: {
      row: row, column: column, color: lightColor, 
      // whether to set the color even if the interface is disabled
      force?: boolean, 
      // whether to add offset caused by the left split to the coordinates
      absolute?: boolean 
    }){
      const linnOptions = { 
        row: options.row, 
        column: options.column + (options.absolute ? 0 : this.#getLeftSplitWidth()), 
        color: options.color 
      }

      this.#linn.setLight(linnOptions)
    }
  }
}