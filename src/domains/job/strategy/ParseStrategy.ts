import { StategyModel } from "./StategyModel";
import { JobStrategyBranch } from "./JobStrategyBranch";
import { JobStrategyTag } from "./JobStrategyTag";
import { JobStrategyOr } from "./JobStrategyOr";
import { JobStrategyAnd } from "./JobStrategyAnd";


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
      if (typeof model.property === "string")
        continue;
      return new cl(model.property as any);
    }
    if (Array.isArray(model.property)) {
      let params = model.property.map((chiledStrategy) => ParseStrategy(chiledStrategy)
      );
      return new cl(params as any);
    }
    let params = ParseStrategy(model.property as StategyModel);
    return new cl(params as any);
  }
}
