import { spawn } from "child_process";
import { mkdir } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { GitService } from "./GitService";
import { JobHandler } from "./JobHandler";
import { JobProject } from "./JobProject";
import streamToPromise from "stream-to-promise";

export class Task {
    private url: string;
    constructor(
        private gitService: GitService,
        private jobProject: JobProject,
        private handler: JobHandler
    ) {

        this.url = join(tmpdir(), Math.round(Math.random() * 100000000).toString(16));
    }

    async before() {
        console.log("START TASK", this.url);
        const commit = this.handler.getLastCommit();
        // создаём временную директорию
        await mkdir(this.url, 0o777);
        // клонируем репозиторий
        let result = await this.gitService.gitCommand(
            this.url,
            'clone', this.jobProject.GitURL,
            "--branch", commit.branch[0],
            "--single-branch"
        );
        console.log(result);
        // переходим в папку
        const ls = await streamToPromise(spawn("ls").stdout);
        const dir = ls.split("\n").map(r => r.trim())[0];
        this.url = join(this.url, dir)

        // делаем переход на коммит
        await this.gitService.gitCommand(this.url, "reset", "--hard", commit.hash);
        // this.gitService.gitCommand(this.jobProject.projectPath, )
    }
    async start(before?: () => void, after?: () => void) {
        before?.();
        this.before();
        await this.handler.execute();
        after?.();
    }
}