import { Config } from "../../Config";
import { UtilitiesService } from "../../UtilitiesService";
import { FileStorage } from "./FileStorage";
import { GitService } from "./GitService";
import {  ProjectModel } from "./Project";
import { ProjectService } from "./ProjectService";
import { Task } from "./Task";
import { TaskService } from "./TaskService";
 
export class NodeCI {
    
    private projectService: ProjectService;
    private gitService: GitService;
    private taskService: TaskService;

    constructor(private config: Config) {
        const util = new UtilitiesService(); 
        this.gitService = new GitService();
        this.projectService = new ProjectService(util, this.gitService); 
        this.taskService = new TaskService(this.gitService, util);
    }

    async init() { 
        await this.gitService.check();

        const projectStorage = new FileStorage<ProjectModel>(".nstore");
        await projectStorage.update();
        this.projectService.events.addListener("task", (task: Task) => this.addTask(task))
        for(let item of projectStorage.getAll()) {  
            await this.projectService.add(item); 
        }
    }

    async addProject(name, gitUrl) {}

    async addPipeline(projectId: string, name: number, size: number, timeout: number) {}

    async addTask(task: Task) {
        this.taskService.add(task);
    }
}