import { Commit } from "../../git/Commit";
import { JobStrategy } from "./JobStrategy";


export class JobStrategyNot implements JobStrategy {
  constructor(private strategy: JobStrategy) { }

  execute(commit: Commit): boolean {
    return !this.strategy.execute(commit);
  }
  toString() {
    if (this.strategy.constructor.name == 'JobStrategyTag') {
      return this.strategy.toString().replace("like", "not like");
    }
    if (this.strategy.constructor.name == 'JobStrategyBranch') {
      return this.strategy.toString().replace("like", "not like");
    }
    return "!(" + this.strategy.toString() + ")";
  }

  getModel() {
    return {
      class: this.constructor.name,
      property: this.strategy.getModel(),
    };
  }
}
