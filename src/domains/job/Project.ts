import EventEmitter from "events";
import { join } from "path";
import { Commit, CommitModel } from "../git/Commit";
import { CommitRepository } from "../git/CommitRepository";
import { Pipeline, PipelineModel } from "./Pipeline";
import { Task, TaskModel } from "./Task";
import { Watcherable } from "./Watcher";

export interface ProjectModel {
  id: string;
  name: string;
  git: string;
  path: string;
  handlers: PipelineModel[];
  commits: CommitModel[];
}

export class Project implements Watcherable {
  // Какие нужны программы -> чекнуть, есть ли они
  private handlers: Pipeline[] = [];
  private task: Task[] = [];
  private taskExecuted: Task[] = [];
  private projectPath: string;

  private repository = new CommitRepository();

  /**
   * Добавление задачи
   * ```typescript
   * events.on("commit", (t: Task) => void );
   * ```
   * 
   */
  events = new EventEmitter();

  constructor(
    public id: string,
    private GitURL: string,
    private name: string
  ) { }

  getRemoteGit() {
    return this.GitURL;
  }

  setPath(path: string) {
    this.projectPath = join(
      path,
      this.GitURL
        .split("/")[this.GitURL.split("/").length - 1]
        .replace(".git", "")
    );
  }

  getPath() {
    return this.projectPath;
  }

  addPipeline(handler: Pipeline) {
    this.handlers.push(handler);
  }

  addCommit(commit: Commit) {
    // console.log("add comit", commit.getModel());
    this.repository.add(commit);
    this.tryHandle(commit);
  }

  private tryHandle(commit) {
    // console.log("try handle", commit.getModel());
    for (const handler of this.handlers) {
      const isHandle = handler.isHandle(commit);
      // console.log("> handle", isHandle, handler.getModel());
      if (!isHandle) continue;
      const task = new Task(this.getRemoteGit(), handler);
      console.debug("ADD TASK", task.getName());
      this.events.emit("task", task);
    }
  }

  getModel(): ProjectModel {
    return {
      id: this.id,
      name: this.name,
      git: this.GitURL,
      path: this.projectPath,
      handlers: this.handlers.map((r) => r.getModel()),
      commits: this.repository.getAll().map((r) => r.getModel()),
    };
  }
}
