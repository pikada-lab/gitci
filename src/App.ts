import { Config } from "./Config";
import { FileStorage } from "./domains/job/FileStorage";
import { GitService } from "./domains/job/GitService";
import { JobProject } from "./domains/job/JobProject";
import { ProjectService } from "./domains/job/ProjectService";
import { Whatcher } from "./domains/job/Whatcher";

export class App {
    constructor(private config: Config) {
        console.log(this.config.get("path"), this.config.get("root"), this.config.get("timeout"));

    }
    async start() {
        const projectService = new ProjectService();

        const gitService = new GitService();
        await gitService.check();
        
        const fileStorage = new FileStorage(".nstore");
        await fileStorage.update();
        for(let item of fileStorage.getAll()) { 
            const project = new JobProject(gitService);
            await project.init(item.name, item.git);
            await projectService.add(project);
            const watcher = new Whatcher(gitService, project);
            watcher.start();
        }
        // TEST    
        // project.setTask(new Task(gitService, project, handler));
        // console.log(handler.getLastCommit());
        // await fileStorage.save([project.getModel()]);
    }
    stop() {

    }
}

