namespace L {
  /**
   * Allows setting different callbacks for taps and long-presses.
   */
  export class PressHandler {
    longPressTasks: {
      [note: number]: { taskId: string; shortPress: () => void };
    };
    taskManager: TaskManager;

    constructor(taskManager: TaskManager) {
      this.longPressTasks = {};
      this.taskManager = taskManager;
    }

    handlePressBegin(
      shortPress: () => void,
      longPress: () => void,
      buttonId: number,
      millis: number = 500,
    ) {
      const taskId = this.taskManager.scheduleTask(() => {
        longPress();
        delete this.longPressTasks[buttonId];
      }, millis);
      this.longPressTasks[buttonId] = { taskId, shortPress };
    }

    handlePressEnd(buttonId: number) {
      if (this.longPressTasks[buttonId] !== undefined) {
        this.longPressTasks[buttonId].shortPress();
        this.taskManager.cancelTask(this.longPressTasks[buttonId].taskId);
        delete this.longPressTasks[buttonId];
      }
    }
  }
}
