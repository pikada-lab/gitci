import { Project, ProjectModel } from "./Project";
import { Pipeline } from "./Pipeline";
import { JobStrategyBranch } from "./strategy/JobStrategyBranch";
import { ParseStrategy } from "./strategy/ParseStrategy";
import { Job } from "./Job";
import { UtilitiesService } from "../../UtilitiesService";
import { GitService } from "./GitService";
import { mkdir } from "fs/promises";
import { Watcher } from "./Watcher";
import { Commit } from "../git/Commit";
import { Task } from "./Task";
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

            item.handlers.forEach(handler => {
                // const strategy = ParseStrategy(handler.strategy)
                const strategy = ConditionParser(handler.strategy)
                // TODO: Job to Job[]
                const job = new Job(handler.job.name, handler.job.scripts);
                project.addPipeline(new Pipeline(handler.id, strategy, job, handler.environment));
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
        const strategy = new JobStrategyBranch("master");
        //new JobStrategyOr(new JobStrategyBranch("dev"), new JobStrategyBranch("test"));
        const pipe = new Pipeline(this.util.IDGen(), strategy,
            new Job("Test job", [
                "npm ci",
                "npm install typescript",
                "npm install codecov ",
                "tsc",
                "npm test",
                "codecov -f coverage/*.json"
            ]), { "TOKEN_ICQ": "001.0232927109.1999608478:751212693" });

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