import { Commit } from "../../git/Commit";
import { PipeStrategy } from "./PipeStrategy";


export class PipeStrategyTag implements PipeStrategy {
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
