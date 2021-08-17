import { Commit } from "../../git/Commit";
import { PipeStrategy } from "./PipeStrategy";


export class PipeStrategyNot implements PipeStrategy {
  constructor(private strategy: PipeStrategy) { }

  execute(commit: Commit): boolean {
    return !this.strategy.execute(commit);
  }
  toString() {
    if (this.strategy.constructor.name == 'PipeStrategyTag') {
      return this.strategy.toString().replace("like", "not like");
    }
    if (this.strategy.constructor.name == 'PipeStrategyBranch') {
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
