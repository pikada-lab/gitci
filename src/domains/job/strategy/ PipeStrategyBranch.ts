import { Commit } from "../../git/Commit";
import { PipeStrategy } from "./PipeStrategy";


export class PipeStrategyBranch implements PipeStrategy {
  constructor(private branch: string) { }

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
