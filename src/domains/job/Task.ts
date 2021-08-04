import { mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { GitService } from "./GitService";
import { Pipeline } from "./Pipeline";
import EventEmitter from "events";
import { UtilitiesService } from "../../UtilitiesService";
export enum TaskStatus {
  PENDING = 1,
  PREPARING,
  BUILDING,
  FINISHED,
  ERROR,
}

export interface TaskModel {
  path: string;
  status: TaskStatus;
}
export class Task {
  public id: string;
  private path: string;
  private timeout: number = 10000;
  private statusValue = TaskStatus.PENDING;

  private error: string;
  /**
   * События выполняемой задачи
   * 
   * ```typescript
   * events.on("changeStatus", (task: Task, oldStatus: TaskStatus, newStatus: TaskStatus) => void)
   * ```
   */
  public events = new EventEmitter();

  get status() {
    return this.statusValue;
  }

  set status(status: TaskStatus) {
    if (this.statusValue === status) return;
    let oldStatus = this.statusValue;
    this.statusValue = status;
    this.events.emit("changeStatus", this, oldStatus, status); 
  }

  constructor(private remoteGit: string, private handler: Pipeline) {
    this.path = join(
      tmpdir(),
      Math.round(Math.random() * 100000000).toString(16)
    ); 
  }

  getName() {
    return "Task " + this.id + " | " + this.handler.getModel().strategy
  }

  getModel(): TaskModel {
    return {
      path: this.path,
      status: this.status,
    };
  }

  async prepare(gitService: GitService, utilService: UtilitiesService ) {
 
    this.id = utilService.IDGen()
    try {
      if (this.status != TaskStatus.PENDING)
        throw new Error("Обратный порядок работы задач");
      this.status = TaskStatus.PREPARING;
      await mkdir(this.path, 0o777);

      await gitService.clone(
        this.path,
        this.remoteGit,
        this.handler.LastCommit.branch[0]
      );
      const dir = this.remoteGit
        .split("/")
      [this.remoteGit.split("/").length - 1].replace(".git", "");
      this.path = join(this.path, dir);
      await gitService.gitCommand(
        this.path,
        "reset",
        "--hard",
        this.handler.LastCommit.hash
      );
    } catch (ex) {
      console.log(ex);
      this.status = TaskStatus.ERROR;
    }
  }
  async start() {
    try {
      const timeout = setTimeout(_ => {
        this.handler.stop();
        this.error = 'Timeout '+this.timeout;
        this.status = TaskStatus.ERROR;
      }, this.timeout)
      this.status = TaskStatus.BUILDING;
      await this.handler.execute(this.path);
      this.status = TaskStatus.FINISHED;
      clearTimeout(timeout);
    } catch (ex) {
      console.log(ex);
      this.error = ex.message;
      this.status = TaskStatus.ERROR;
    }
  }

  getError() {
    return this.error;
  }
}
