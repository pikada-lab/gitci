import { GitService } from "./GitService"; 
import { Task } from "./Task";

export class TaskService {
  constructor(private gitService: GitService) {}
 

  private status = 0;
  start() {
    if (this.status == 1) return;
    this.status = 1;
    this.execute().then(() => {
      this.status = 0;
    });
  }

  async execute() {
    console.log("Start execute");
    let task = this.task.shift();
    if (!task) return console.log("NOT HAVE TASK");
    this.taskExecuted.push(task);
    await task.start();
    await task.prepare(this.gitService);
    await this.execute(task);
    if (this.task.length) {
      await this.execute();
    }
  }

}
 
