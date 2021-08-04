import { UtilitiesService } from "../../UtilitiesService";
import { GitService } from "./GitService";
import { Task, TaskStatus } from "./Task";

export class TaskService {

  private status = 0;

  private pending: Task[] = [];
  private completed: Task[] = [];
  private processing: Task[] = [];

  constructor(private gitService: GitService, private utilService: UtilitiesService) { }


  start() {
    if (this.status == 1) return;
    this.status = 1;
    this.execute().then(() => {
      this.status = 0;
    });
  }

  async execute() {
    console.log("Start execute");

    const task = this.shiftTask();
    if (!task) return console.log("NOT HAVE TASK");
    await this.run(task);
    this.shiftProcessing(task);
    await this.execute();
    if (this.pending.length) {
      await this.execute();
    }
  }

  private shiftTask() {
    let task = this.pending.shift();
    if (!task) { return null; }
    this.processing.push(task);
    return task;
  }
  private async run(task: Task) {
    task.events.addListener("changeStatus", this.log)
    await task.prepare(this.gitService, this.utilService);
    await task.start();
  }

  private shiftProcessing(task: Task) {
    const index = this.processing.findIndex(r => r == task);
    delete this.processing[index];
    this.completed.push(task);
  }


  log(t: Task, oldStatus: TaskStatus, newStatus: TaskStatus) {
    console.log(`TASK: changeStatus ${t.id} ${oldStatus} => ${newStatus}`);
  }

  add(task: Task) {
    this.pending.push(task);
    this.start();
  }

}

