import { Commit } from "../../git/Commit";
import { JobStrategy } from "./JobStrategy";


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
