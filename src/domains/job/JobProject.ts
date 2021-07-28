import { mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { Commit, CommitModel } from "../git/Commit";
import { CommitRepository } from "../git/CommitRepository";
import { GitService } from "./GitService";
import { JobHandler, JobHandlerModel } from "./JobHandler";
import { Task, TaskModel } from "./Task";

export interface ProjectModel {
    name: string;
    git: string;
    path: string;
    handlers: JobHandlerModel[];
    tasks: TaskModel[];
    commits: CommitModel[];
}

export class JobProject {

    // Какие нужны программы -> чекнуть, есть ли они
    private handlers: JobHandler[] = [];
    private task: Task[] = [];
    private taskExecuted: Task[] = [];
    public projectPath: string = "/";

    private repository = new CommitRepository();
    public name: string;
    public GitURL: string;
    constructor(private gitService: GitService) { }

    async init(name: string, GitURL: string) {
        this.GitURL = GitURL;
        this.name = name;
        if (!this.GitURL) throw new Error("Нет удалённого репозитория");

        const path = join(tmpdir(), Math.round(Math.random() * 100000000).toString(16));
        console.log("START INIT REPO", this.GitURL, " >> ", path);
        // создаём временную директорию
        await mkdir(path, 0o777);
        await this.gitService.clone(path, this.GitURL);
        this.projectPath = join(path, this.GitURL.split("/")[this.GitURL.split("/").length - 1].replace(".git", ""));

    }
    addHandler(handler: JobHandler) {
        this.handlers.push(handler);
        // tryHandle
        for (let commit of this.repository.getAll()) {
            if (handler.isHandle(commit)) continue;
            this.addTask(new Task(this.gitService, this, handler));
        }
    }
    addCommit(commit: Commit) {
        console.log("add comit", commit.getModel());
        this.repository.add(commit);
        this.tryHandle(commit);
    }

    private tryHandle(commit) {
        console.log("try handle", commit.getModel());
        for (const handler of this.handlers) {
            const isHandle = handler.isHandle(commit);
            console.log("> handle", isHandle, handler.getModel());
            if (!isHandle) continue;
            this.addTask(new Task(this.gitService, this, handler));
        };
    }

    addTask(task: Task) {
        console.log("ADD TASK", task.getModel());
        this.task.push(task);
        this.start();
    }

    private status = 0;
    start() {
        if (this.status == 1) return;
        this.status = 1;
        this.execute().then(() => {
            this.status = 0;
        })
    }


    async execute() {
        console.log("Start execute");
        let task = this.task.shift();
        if (!task) return console.log("NOT HAVE TASK");
        this.taskExecuted.push(task);
        await task.start();
        if (this.task.length) {
            await this.execute();
        }
    }

    getModel(): ProjectModel {
        return {
            name: this.name,
            git: this.GitURL,
            path: this.projectPath,
            handlers: this.handlers.map(r => r.getModel()),
            tasks: [...this.task, ...this.taskExecuted].map(r => r.getModel()),
            commits: this.repository.getAll().map(r => r.getModel())
        }
    }
}

