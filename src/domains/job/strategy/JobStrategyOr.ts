import { Commit } from "../../git/Commit";
import { JobStrategy } from "./JobStrategy";


export class JobStrategyOr implements JobStrategy {
  private strategies: JobStrategy[];
  constructor(...strategy: JobStrategy[]) {
    this.strategies = strategy;
  }
  execute(commit: Commit): boolean {
    return !!~this.strategies.findIndex((r) => r.execute(commit));
  }

  toString() {
    return "(" + this.strategies.map((r) => r.toString()).join(" OR ") + ")";
  }

  getModel() {
    return {
      class: this.constructor.name,
      property: this.strategies.map((r) => r.getModel()),
    };
  }
}
