import { Commit } from "../../git/Commit";
import { JobStrategy } from "./JobStrategy";


export class JobStrategyBranch implements JobStrategy {
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
