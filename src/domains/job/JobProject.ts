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
  tasks: TaskModel[];
  commits: CommitModel[];
}
export class JobProject implements Watcherable {
  // Какие нужны программы -> чекнуть, есть ли они
  private handlers: Pipeline[] = [];
  private task: Task[] = [];
  private taskExecuted: Task[] = [];
  private projectPath: string;

  private repository = new CommitRepository();

  events = new EventEmitter();

  constructor(
    public id: string,
    private GitURL: string,
    private name: string
  ) {}

  getRemoteGit() {
    return this.GitURL;
  }

  setPath(path: string) {
    this.projectPath = join(
      path,
      this.GitURL.split("/")[this.GitURL.split("/").length - 1].replace(
        ".git",
        ""
      )
    );
  }

  getPath() {
    return this.projectPath;
  }

  addPipeline(handler: Pipeline) {
    this.handlers.push(handler);
    for (let commit of this.repository.getAll()) {
      if (handler.isHandle(commit)) continue;
      // Исполнитьсв
      this.events.emit("handle", handler);
      this.addTask(new Task(this.getRemoteGit(), handler));
    }
  }
  addCommit(commit: Commit) {
    console.log("add comit", commit.getModel());
    this.repository.add(commit);
    this.tryHandle(commit);
  }

  private tryHandle(commit) {
    console.log("try handle", commit.getModel());
    for (const handler of this.handlers) {
      const isHandle = handler.isHandle(commit);
      console.log("> handle", isHandle, handler.getModel());
      if (!isHandle) continue;
      this.events.emit("handle", handler);
      this.addTask(new Task(this.getRemoteGit(), handler));
    }
  }

  addTask(task: Task) {
    console.log("ADD TASK", task.getModel());
    this.task.push(task);
    this.start();
  }

 

  getModel(): ProjectModel {
    return {
      id: this.id,
      name: this.name,
      git: this.GitURL,
      path: this.projectPath,
      handlers: this.handlers.map((r) => r.getModel()),
      tasks: [...this.task, ...this.taskExecuted].map((r) => r.getModel()),
      commits: this.repository.getAll().map((r) => r.getModel()),
    };
  }
}
