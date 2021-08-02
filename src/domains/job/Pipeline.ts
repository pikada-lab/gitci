import { Commit, CommitModel } from "../git/Commit";
import { Job, JobModel } from "./Job";

export class PipelineModel {
  id: string;
  strategy: StategyModel;
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
  ) {}

  isHandle(commit: Commit) {
    if (!this.strategy.execute(commit)) return false;
    if (this.lastCommit && this.lastCommit.date >= commit.date) return false;
    this.lastCommit = commit;
    return true;
  }

  async execute(path: string): Promise<void> {
    await this.job.executed(path, this.environment);
  }

  getModel(): PipelineModel {
    return {
      id: this.id,
      strategy: this.strategy.getModel(),
      job: this.job.getModel(),
      lastCommit: this.lastCommit?.getModel(),
      environment: this.environment,
    };
  }
}

export function ParseStrategy(model: StategyModel) {
  let stragegyClass = [
    JobStrategyAnd,
    JobStrategyOr,
    JobStrategyAnd,
    JobStrategyTag,
    JobStrategyBranch,
  ];
  for (let cl of stragegyClass) {
    if (cl.constructor.name != model.class) {
      if (typeof model.property === "string") continue;
      return new cl(model.property as any);
    }
    if (Array.isArray(model.property)) {
      let params = model.property.map((chiledStrategy) =>
        ParseStrategy(chiledStrategy)
      );
      return new cl(params as any);
    }
    let params = ParseStrategy(model.property as StategyModel);
    return new cl(params as any);
  }
}

export interface StategyModel {
  class: string;
  property: StategyModel[] | StategyModel | string;
}

export interface JobStrategy {
  execute(commit: Commit): boolean;
  toString(): string;
  getModel(): StategyModel;
}

export class JobStrategyAnd implements JobStrategy {
  private strategies: JobStrategy[];
  constructor(...strategy: JobStrategy[]) {
    this.strategies = strategy;
  }
  execute(commit: Commit): boolean {
    return !~this.strategies.findIndex((r) => !r.execute(commit));
  }

  toString() {
    return this.strategies.map((r) => r.toString()).join(" AND ");
  }
  getModel() {
    return {
      class: this.constructor.name,
      property: this.strategies.map((r) => r.getModel()),
    };
  }
}

export class JobStrategyOr implements JobStrategy {
  private strategies: JobStrategy[];
  constructor(...strategy: JobStrategy[]) {
    this.strategies = strategy;
  }
  execute(commit: Commit): boolean {
    return !!~this.strategies.findIndex((r) => r.execute(commit));
  }

  toString() {
    return "(" + this.strategies.map((r) => r.toString()).join(") OR (") + ")";
  }

  getModel() {
    return {
      class: this.constructor.name,
      property: this.strategies.map((r) => r.getModel()),
    };
  }
}

export class JobStrategyNot implements JobStrategy {
  constructor(private strategy: JobStrategy) {}
  execute(commit: Commit): boolean {
    return !this.strategy.execute(commit);
  }
  toString() {
    return "!" + this.strategy.toString();
  }

  getModel() {
    return {
      class: this.constructor.name,
      property: this.strategy.getModel(),
    };
  }
}

export class JobStrategyTag implements JobStrategy {
  private tag: RegExp;
  constructor(private tagString: string) {
    this.tag = new RegExp(`(^|\s)(${tagString})(,|$)`, "i");
  }

  execute(commit: Commit): boolean {
    return this.tag.test(commit.tag);
  }
  toString() {
    return "$tag like " + this.tagString.toString();
  }
  getModel() {
    return {
      class: this.constructor.name,
      property: this.tagString,
    };
  }
}

export class JobStrategyBranch implements JobStrategy {
  constructor(private branch: string) {}

  execute(commit: Commit): boolean {
    return !!~commit.branch.findIndex((r) => this.branch === r);
  }

  toString() {
    return "$branch like " + this.branch.toString();
  }

  getModel() {
    return {
      class: this.constructor.name,
      property: this.branch,
    };
  }
}
