import { mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { GitService } from "./GitService";
import EventEmitter from "events";
import { UtilitiesService } from "../../UtilitiesService";
import { ChildProcess, spawn } from "child_process";
import { StepModel } from "./Step";
import { Commit } from "../git/Commit";
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
  error: string;
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
  private bash: ChildProcess;

  private name: string;
  private steps: StepModel[];
  private environment: { [key: string]: string };

  get status() {
    return this.statusValue;
  }

  set status(status: TaskStatus) {
    if (this.statusValue === status) return;
    let oldStatus = this.statusValue;
    this.statusValue = status;
    this.events.emit("changeStatus", this, oldStatus, status);
  }

  constructor(
    private remoteGit: string,
    private commit: Commit
  ) {
    this.path = join(
      tmpdir(),
      Math.round(Math.random() * 100000000).toString(16)
    );
  }

  configure(
    name: string,
    steps: StepModel[],
    environment: { [key: string]: string }
  ) {
    this.name = name;
    this.steps = steps;
    this.environment = environment;
  }


  getName() {
    return "Task " + this.id + " | " + this.name
  }

  getModel(): TaskModel {
    return {
      path: this.path,
      status: this.status,
      error: this.error,

    };
  }

  async prepare(gitService: GitService, utilService: UtilitiesService) {

    this.id = utilService.IDGen()
    try {
      if (this.status != TaskStatus.PENDING)
        throw new Error("Обратный порядок работы задач");
      this.status = TaskStatus.PREPARING;
      await mkdir(this.path, 0o777);

      await gitService.clone(
        this.path,
        this.remoteGit,
        this.commit.branch[0]
      );
      const dir = this.remoteGit
        .split("/")
      [this.remoteGit.split("/").length - 1].replace(".git", "");
      this.path = join(this.path, dir);
      await gitService.gitCommand(
        this.path,
        "reset",
        "--hard",
        this.commit.hash
      );
    } catch (ex) {
      console.log(ex);
      this.status = TaskStatus.ERROR;
    }
  }
  async start() {
    try {
      const timeout = setTimeout(_ => {
        this.stop();
        this.error = 'Timeout ' + this.timeout;
        this.status = TaskStatus.ERROR;
      }, this.timeout)
      this.status = TaskStatus.BUILDING;
      await this.execute(this.path);
      this.status = TaskStatus.FINISHED;
      clearTimeout(timeout);
    } catch (ex) {
      console.log(ex);
      this.error = ex.message;
      this.status = TaskStatus.ERROR;
    }
  }

  stop() {
    this.bash.kill(9);
  }

  async execute(path: string) {

    let result = "";
    return new Promise(async (resolve, reject) => {
      try {
        // spawn bash shell
        console.log(`START STEP: ${this.name}`);
        this.bash = spawn("/bin/bash", [], {
          // shell: false,
          env: Object.assign(process.env, {
            "NODE_ENV": 'debug'
          }, this.environment),
          cwd: path
        });

        this.bash.stdout.on("data", (text) => {
          result += text.toString('utf8');
          console.log(text?.toString("utf8"))
        });

        this.bash.stderr.on("data", (err) => {
          result += "> " + err?.toString("utf8") + "\n";
          console.log(err?.toString("utf8"))
          this.bash.kill(1);
          reject(err);
        });

        this.bash.on("close", (code) => {
          console.log(result?.toString());
          console.log(`END STEP with code ${code}: ${this.name}`);

          resolve(result);
        })
        for (let step of this.steps) {
          for (let script of [
            'echo "-----------------\nSTEP ' + step.name,
            ...step.scripts,
            "exit"
          ]) {
            await new Promise((res) => {
              setTimeout(() => {
                result += "$ " + script + "\n";
                this.bash.stdin.write(script + "\n\n");
                res(true);
              }, 10)
            });
          }
        }
      } catch (ex) {
        this.error = ex.message;
        resolve(result);
      }
    })

  }


  getError() {
    return this.error;
  }
}
