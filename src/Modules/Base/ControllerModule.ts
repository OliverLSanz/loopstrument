namespace _ {
  export interface ModuleContext {
    bitwig: Bitwig;
    pressHandler: PressHandler;
    linnstrument: LinnStrument;
    controller: LiveLoopingController;
  }

  /**
   * Base class for controller modules
   */
  export class ControllerModule {
    bitwig: Bitwig;
    pressHandler: PressHandler;
    linn: LinnStrument;
    controller: LiveLoopingController;
    #onUpdate: Function[];
    #isEnabled: boolean = false;

    constructor(context: ModuleContext) {
      this.bitwig = context.bitwig;
      this.pressHandler = context.pressHandler;
      this.linn = context.linnstrument;
      this.controller = context.controller;
      this.#onUpdate = [];
    }

    init(): void {}

    update(): void {
      if (this.#isEnabled) {
        this.#onUpdate.forEach((callback) => callback());
      }
    }

    enable() {
      this.#isEnabled = true;
    }

    disable() {
      this.#isEnabled = false;
    }

    handleMidi(midi: MidiMessage): boolean {
      return false;
    }

    addValueObserver(
      subject: { addValueObserver: Function },
      callback: () => any,
    ): void {
      const callbackIfEnabled = () => {
        if (this.#isEnabled) {
          callback();
        }
      };

      subject.addValueObserver(callbackIfEnabled);
      this.#onUpdate.push(callback);
    }

    addInitCallback(callback: () => void): void {
      callback();
      this.#onUpdate.push(callback);
    }
  }
}
