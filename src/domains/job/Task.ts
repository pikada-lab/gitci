import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { GitService } from "./GitService";
import streamToPromise from "stream-to-promise";
import { Pipeline } from "./Pipeline";
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
  private path: string;
  public status = TaskStatus.PENDING;
  constructor(private remoteGit: string, private handler: Pipeline) {
    this.path = join(
      tmpdir(),
      Math.round(Math.random() * 100000000).toString(16)
    );
  }

  getModel(): TaskModel {
    return {
      path: this.path,
      status: this.status,
    };
  }

  async prepare(gitService: GitService) {
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
      this.status = TaskStatus.BUILDING;
      await this.handler.execute(this.path);
      this.status = TaskStatus.FINISHED;
    } catch (ex) {
      console.log(ex);
      this.status = TaskStatus.ERROR;
    }
  }
}
