import { Commit } from "../../git/Commit";
import { StategyModel } from "./StategyModel";


export interface PipeStrategy {
  execute(commit: Commit): boolean;
  toString(): string;
  getModel(): StategyModel;
}
