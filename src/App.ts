import { Config } from "./Config";
import { GitService } from "./domains/job/GitService";
import { Job } from "./domains/job/Job";
import { JobStrategyBranch, JobHandler } from "./domains/job/JobHandler";
import { JobProject } from "./domains/job/JobProject";
import { Task } from "./domains/job/Task";
import { JobEmitter } from "./domains/jobEmitter/JobEmitter";

export class App {
    constructor(private config: Config) {
        console.log(this.config.get("path"), this.config.get("root"), this.config.get("timeout"));
    }
    async start() {
        const gitService = new GitService();
        await gitService.check();
        // TEST
        const strategy = new JobStrategyBranch("dev");
        const project = new JobProject("/Users/dzhigurda/DLD/server/", "https://dldcoin-admin@bitbucket.org/dldcoin/server.git");
        const handler = new JobHandler(strategy, new Job());
        project.addHandler(handler)

        await new JobEmitter(gitService, project).handle();

        // project.setTask(new Task(gitService, project, handler));
        console.log(handler.getLastCommit());
        await project.execute();
    }
    stop() {

    }
}

