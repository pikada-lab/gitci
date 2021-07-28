import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { GitService } from "./GitService";
import { JobHandler } from "./JobHandler";
import { JobProject } from "./JobProject";
import streamToPromise from "stream-to-promise";
export enum TaskStatus {
    PENDING = 1,
    EXECUTE,
    BUILDING,
    FINISHED,
    ERROR
}

export interface TaskModel {
    path: string;
    status: TaskStatus;
}
export class Task {
    private path: string;
    public status = TaskStatus.PENDING;
    constructor(
        private gitService: GitService,
        private jobProject: JobProject,
        private handler: JobHandler
    ) { }

    getModel(): TaskModel {
        return {
            path: this.path,
            status: this.status
        }
    }

    async before() {

        this.path = join(tmpdir(), Math.round(Math.random() * 100000000).toString(16));
        console.log("START TASK", this.path);
        const commit = this.handler.LastCommit;
        // создаём временную директорию
        await mkdir(this.path, 0o777);
        // клонируем репозиторий
        await this.gitService.clone(this.path, this.jobProject.GitURL, commit.branch[0])
        // переходим в папку
        const ls = await streamToPromise(spawn("ls", [], { cwd: this.path }).stdout);
        const dir = ls.toString("utf8").split("\n").map(r => r.trim())[0];
        this.path = join(this.path, dir);
        // делаем переход на коммит
        await this.gitService.gitCommand(this.path, "reset", "--hard", commit.hash);
        // this.gitService.gitCommand(this.jobProject.projectPath, )
    }
    async start() {
        try {
            this.status = TaskStatus.EXECUTE;
            await this.before();
            this.status = TaskStatus.BUILDING;
            await this.handler.execute(this.path);
            this.status = TaskStatus.FINISHED;
        } catch (ex) {
            console.log(ex);
            this.status = TaskStatus.ERROR;
        }
    }
}