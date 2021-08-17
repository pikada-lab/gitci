import { StategyModel } from "./StategyModel";
import { PipeStrategyBranch } from "./ PipeStrategyBranch";
import { PipeStrategyTag } from "./ PipeStrategyTag";
import { PipeStrategyOr } from "./PipeStrategyOr";
import { PipeStrategyAnd } from "./ PipeStrategyAnd";


export function ParseStrategy(model: StategyModel) {
  let stragegyClass = [
    PipeStrategyAnd,
    PipeStrategyOr,
    PipeStrategyAnd,
    PipeStrategyTag,
    PipeStrategyBranch,
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
