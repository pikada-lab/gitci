import { Config } from "../../Config";
import { UtilitiesService } from "../../UtilitiesService";
import { FileStorage } from "./FileStorage";
import { GitService } from "./GitService";
import { JobProject, ProjectModel } from "./JobProject";
import { ProjectService } from "./ProjectService";
 
export class NodeCI {
    
    private projectService: ProjectService;
    private gitService: GitService;

    constructor(private config: Config) {
        const util = new UtilitiesService(); 
        this.gitService = new GitService();
        this.projectService = new ProjectService(util, this.gitService); 
    }

    async init() { 
        await this.gitService.check();

        const projectStorage = new FileStorage<ProjectModel>(".nstore");
        await projectStorage.update();
        for(let item of projectStorage.getAll()) {  
            await this.projectService.add(item); 
        }
    }

    async addProject(name, gitUrl) {}

    async addPipeline(projectId: string, name: number, size: number, timeout: number) {}

}