import { Commit, CommitModel } from "../git/Commit";
import { Job, JobModel } from "./Job";
import { StategyModel } from "./strategy/StategyModel";
import { JobStrategy } from "./strategy/JobStrategy";
import { Task } from "./Task";

export class PipelineModel {
  id: string;
  name: string;
  strategy: string;
  jobs: JobModel[];
  lastCommit: CommitModel;
  environment: { [key: string]: string };
}

export class Pipeline {
  private lastCommit: Commit;

  get LastCommit() {
    return this.lastCommit;
  }
  set LastCommit(commit: Commit) {
    this.lastCommit = commit;
  }

  constructor(
    private id: string,
    private name: string,
    private environment: { [key: string]: string },
    private strategy: JobStrategy,
    private jobs: Job[]
  ) { }

  isHandle(commit: Commit) {
    try {
      if (!this.strategy.execute(commit)) return false;
      if (this.lastCommit && this.lastCommit.date >= commit.date) return false;
      this.lastCommit = commit;
      return true;
    } catch (ex) {
      console.log(commit, this)
      return false;
    }
  }

  configure(t: Task) {
    t.configure(
      this.name,
      this.jobs.map(r => r.getModel()),
      this.environment
    )
  }

  getModel(): PipelineModel {
    return {
      id: this.id,
      name: this.name,
      strategy: this.strategy.toString(),
      jobs: this.jobs.map(r => r.getModel()),
      lastCommit: this.lastCommit?.getModel(),
      environment: this.environment,
    };
  }
}


