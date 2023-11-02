namespace L {
  type ScheduledTasks = Set<string>;

  /**
   * Used to schedule tasks for future execution
   */
  export class TaskManager {
    #scheduledTasks: ScheduledTasks;
    #host: API.ControllerHost;

    constructor(host: API.ControllerHost) {
      this.#scheduledTasks = new Set<string>();
      this.#host = host;
    }

    scheduleTask(task: () => void, millis: number) {
      const taskUID = new Date().toISOString();
      this.#scheduledTasks.add(taskUID);

      this.#host.scheduleTask(() => {
        if (this.#scheduledTasks.has(taskUID)) {
          task();
          this.#scheduledTasks.delete(taskUID);
        }
      }, millis);

      return taskUID;
    }

    cancelTask(taskId: string) {
      this.#scheduledTasks.delete(taskId);
    }
  }
}
