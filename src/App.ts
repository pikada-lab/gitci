import { Config } from "./Config";
import { Commit } from "./domains/git/Commit";
import { JobStrategyAnd, JobStrategyOr, JobStrategyTag, JobStrategyBranch, JobSetting, JobStrategyNot } from "./domains/job/JobSetting";
import { JobEmitter } from "./domains/jobEmitter/JobEmitter";

export class App {
    constructor(private config: Config) {
        console.log(this.config.get("path"), this.config.get("root"), this.config.get("timeout"));
    }
    async start() {
        // TEST
        const strategy = new JobStrategyAnd(
            new JobStrategyOr(
                new JobStrategyTag("latest"),
                new JobStrategyTag("v1")
            ),
            new JobStrategyBranch("dev"),
            new JobStrategyNot( 
                new JobStrategyTag("v2")
            )
        ) 
        const setting = new JobSetting(strategy, 60, "/Users/dzhigurda/DLD/server/");

        await setting.check(); 
        new JobEmitter(setting).handle();
    }
    stop() {

    }
}

