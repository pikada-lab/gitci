import { Commit } from "../../git/Commit";
import { PipeStrategy } from "./PipeStrategy";


export class PipeStrategyOr implements PipeStrategy {
  private strategies: PipeStrategy[];
  constructor(...strategy: PipeStrategy[]) {
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
