import { Project, ProjectModel } from "./Project";
import { Pipeline } from "./Pipeline";
import { PipeStrategyBranch } from "./strategy/ PipeStrategyBranch"; 
import { Step } from "./Step";
import { UtilitiesService } from "../../UtilitiesService";
import { GitService } from "./GitService";
import { mkdir } from "fs/promises";
import { Watcher } from "./Watcher";
import { Commit } from "../git/Commit"; 
import { EventEmitter } from "events";
import { ConditionParser } from "./strategy/ConditionParser"; 

export class ProjectService {
    private projects: Project[] = [];
    private watcher = new WeakMap<Project, Watcher>();

    public events = new EventEmitter();
    constructor(
        private util: UtilitiesService,
        private gitService: GitService
    ) { }

    async add(item: ProjectModel) {
        try {

            const project = new Project(
                item.id,
                item.git,
                item.name
            );

            item.pipelines.forEach(pipeline => {
                const strategy = ConditionParser(pipeline.strategy)
                const steps = pipeline.steps.map(step => new Step(step.name, step.scripts));
                project.addPipeline(new Pipeline(pipeline.id, pipeline.name, pipeline.environment, strategy, steps));
            })

            item.commits.forEach(commit => {
                project.addCommit(new Commit().parse(commit));
            })

            await this.init(project);
            return true;

        } catch (ex) {
            console.log(ex.message, ex);
            return false;
        }
    }

    async create(repo: string, name: string) {
        const project = new Project(this.util.IDGen(), repo, name);
        await this.init(project);
    }

    async createPipeline() {

    }

    async test() {
        const project = new Project(
            this.util.IDGen(),
            "https://github.com/pikada-lab/icq-bot-nodejs.git",
            "ICQ Bot"
        );

        // из базы данных подгружаем подробности по задачам и работам
        const strategy = new PipeStrategyBranch("master");
        //new PipeStrategyOr(new PipeStrategyBranch("dev"), new PipeStrategyBranch("test"));
        const pipe = new Pipeline(
            this.util.IDGen(),
            'Test pipe',
            { "TOKEN_ICQ": "001.0232927109.1999608478:751212693" },
            strategy,
            [new Step("Test pipe", [
                "npm ci",
                "npm install typescript",
                "npm install codecov ",
                "tsc",
                "npm test",
                "codecov -f coverage/*.json"
            ])]);

        project.addPipeline(pipe);
        await this.init(project);
        this.projects.push(project);
    }

    private async init(project: Project) {

        if (!project.getRemoteGit()) throw new Error("Нет удалённого репозитория");

        project.events.addListener("task", (task) => (this.events.emit("task", task)))
        const path = this.util.getTempPath();
        console.log("START INIT REPO", project.getRemoteGit(), " >> ", path);
        // создаём временную директорию
        await mkdir(path, 0o777);
        await this.gitService.clone(path, project.getRemoteGit());
        project.setPath(path);
        const watcher = new Watcher(this.gitService, project);
        this.watcher.set(project, watcher);
        watcher.start();

    }

    getProjects() {
        return this.projects;
    }

}