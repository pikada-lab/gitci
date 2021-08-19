import { Config } from "../../Config";
import { UtilitiesService } from "../../UtilitiesService";
import { FileStorage } from "./FileStorage";
import { GitService } from "./GitService";
import { Pipeline } from "./Pipeline";
import { ProjectModel } from "./Project";
import { ProjectService } from "./ProjectService";
import { Step } from "./Step";
import { PipeStrategyBranch } from "./strategy/ PipeStrategyBranch";
import { ConditionParser } from "./strategy/ConditionParser";
import { Task } from "./Task";
import { TaskService } from "./TaskService";

export class NodeCI {

    private projectService: ProjectService;
    private gitService: GitService;
    private taskService: TaskService;
    private util: UtilitiesService;
    private file: string;

    constructor(private config: Config) {
        this.util = new UtilitiesService();
        this.gitService = new GitService();
        this.projectService = new ProjectService(this.util, this.gitService);
        this.taskService = new TaskService(this.gitService, this.util);
        this.file = config.get("storeFile");
    }

    async init() {
        await this.gitService.check();
        await this.open(this.file);
    }

    async open(file: string) {
        this.close();
        const projectStorage = new FileStorage<ProjectModel>(file);
        await projectStorage.update();
        this.projectService.events.addListener("task", (task: Task) => this.addTask(task))
        for (let item of projectStorage.getAll()) {
            await this.projectService.add(item);
        }
    }

    async save(file: string) {
        const projectStorage = new FileStorage<ProjectModel>(file);
        projectStorage.save(this.projectService.getProjects().map(r => r.getModel()));
    }

    async close() {
        if (this.projectService) {
            this.projectService.events.removeAllListeners("task");
        }
    }

    async authCode() {
        return this.config.get('key');
    }

    async addProject(name: string, gitUrl: string, projectPath: string) {

        if (!name) throw new Error("Name is not exist");
        if (!gitUrl) throw new Error("GIT URL is not exist");
        if (!projectPath) throw new Error("Project path is not exist");

        this.projectService.add({
            id: this.util.IDGen(),
            name: name || 'New project',
            git: gitUrl,
            path: projectPath,
            pipelines: [],
            commits: [],
        })
    }

    /**
     * Получить все проекты
     * @returns Модели проектов
     */
    getProjects(): ProjectModel[] {
        return this.getProjectsRef().map(r => r.getModel());
    }

    private getProjectsRef() {
        return this.projectService.getProjects()
    }

    private getProjectRef(projectId: string) {
        return this.getProjectsRef().filter(r => r.id === projectId)?.[0];
    }

    getProject(projectId: string): ProjectModel {
        return this.getProjectRef(projectId)?.getModel();
    }

    async addPipeline(projectId: string, name: string, strategy: string, environment: { [key: string]: string }) {

        if (!name) throw new Error("Name is not exist");
        if (!projectId) throw new Error("ProjectID is not exist");
        if (!strategy) throw new Error("Strategy expression is not exist");

        const project = this.getProjectRef(projectId);
        if (!project) throw new Error("Project is not exist");
        const conditions = ConditionParser(strategy);
        project.addPipeline(new Pipeline(this.util.IDGen(), name, environment, conditions, []));
       await this.save(this.file);
    }

    async removePipeline(pipeId: string) {
        this.projectService.getProjects().forEach(r => r.removePipeline(pipeId));
        await this.save(this.file);
    }

    private getPipelines() {
        return this.getProjectsRef().map(r => r.getPipelines()).reduce((acc, prev) => acc.concat(prev), []);
    }

    async addStep(pipeId: string, name: string, scripts: string[]) {

        if (!name) throw new Error("Name is not exist");
        if (!pipeId) throw new Error("PipeId is not exist");
        if (!Array.isArray(scripts)) throw new Error("Scripts is not Array");

        const pipe = this.getPipelines().filter(r => r.getId() === pipeId)?.[0];
        if (!pipe) throw new Error("Pipe is not exist");

        const step = new Step(this.util.keyGen(), name, scripts);
        pipe.pushStep(step);
        await this.save(this.file);
    }

    async removeStep(stepId: string) {
        this.getPipelines().forEach(r => r.removeStep(stepId));
        await this.save(this.file);
    }

    async addTask(task: Task) {
        this.taskService.add(task); 
    }

}