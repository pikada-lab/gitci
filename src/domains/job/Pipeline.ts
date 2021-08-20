import { Commit, CommitModel } from "../git/Commit";
import { Step, StepModel } from "./Step";
import { StategyModel } from "./strategy/StategyModel";
import { PipeStrategy } from "./strategy/PipeStrategy";
import { Task } from "./Task";

export class PipelineModel {
  id: string;
  name: string;
  strategy: string;
  steps: StepModel[];
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
    private strategy: PipeStrategy,
    private steps: Step[]
  ) {}

  getId() {
    return this.id;
  }

  isHandle(commit: Commit) {
    try {
      if (!this.strategy.execute(commit)) return false;
      if (this.lastCommit && this.lastCommit.date >= commit.date) return false;
      this.lastCommit = commit;
      return true;
    } catch (ex) {
      console.log(commit, this);
      return false;
    }
  }

  configure(t: Task) {
    t.configure(
      this.name,
      this.steps.map((r) => r.getModel()),
      this.environment
    );
  }

  getModel(): PipelineModel {
    return {
      id: this.id,
      name: this.name,
      strategy: this.strategy.toString(),
      steps: this.steps.map((r) => r.getModel()),
      lastCommit: this.lastCommit?.getModel(),
      environment: this.environment,
    };
  }

  pushStep(step: Step) {
    this.steps.push(step);
  }
  removeStep(stepId: string) {
    this.steps = this.steps.filter((r) => r.getID() != stepId);
  }
}
