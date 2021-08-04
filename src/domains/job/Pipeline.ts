import { Commit, CommitModel } from "../git/Commit";
import { Job, JobModel } from "./Job";
import { StategyModel } from "./strategy/StategyModel";
import { JobStrategy } from "./strategy/JobStrategy";

export class PipelineModel {
  id: string;
  strategy: string;
  job: JobModel;
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
    private strategy: JobStrategy,
    private job: Job,
    private environment: { [key: string]: string }
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

  async execute(path: string): Promise<void> {
    await this.job.executed(path, this.environment);
  }
  stop() {
    this.job.stop();
  }

  getModel(): PipelineModel {
    return {
      id: this.id,
      strategy: this.strategy.toString(),
      job: this.job.getModel(),
      lastCommit: this.lastCommit?.getModel(),
      environment: this.environment,
    };
  }
}


