import { join, resolve } from "path";
import { Commit } from "../git/Commit";
import streamToPromise from "stream-to-promise";
import gitSpawnedStream from 'git-spawned-stream';
import gitCommits from 'git-commits';
import { CommitRepository } from "../git/CommitRepository";
import { JobProject } from "../job/JobProject";
import { Task } from "../job/Task";
import { GitService } from "../job/GitService";

export class JobEmitter {
    private repoPath: string;
    private repository = new CommitRepository();

    constructor(private gitService: GitService, jobProject: JobProject) {
        this.repoPath = resolve(join(jobProject.projectPath, '/.git'));
        this.repository.events.addListener('after_add', async (commit: Commit) => {
            // console.log(commit);
            for (const handler of jobProject.getHandlers()) {
                console.log(commit, handler.isHandle(commit));
                if (handler.isHandle(commit)) {
                    // Перейти на нужный коммит
                    if (handler.getLastCommit()?.date > commit.date) return;
                    jobProject.setTask(new Task(gitService, jobProject, handler));
                    handler.setLastCommit(commit);
                };
            };
        })
    }

    async handle() {
        console.log(this.repoPath);
        const branchResult = await this.gitService.gitCommand(this.repoPath, 'branch', '--all');
        const branch = branchResult.split("\n").filter(r => /^(\*)\s/.test(r))[0];
        const response = await this.gitService.gitCommand(this.repoPath, 'pull');
        if (response.startsWith("Already up to date.")) {
            console.log("no pull", branch);
        } else {
            console.log("execute pull", branch);
        }
        let commits = await streamToPromise(gitCommits(this.repoPath, { limit: 1000 }));
        commits = commits.map(r => new Commit().setRef(r)) as Commit[];
        await Promise.all(commits.map(r => this.gitService.getCommitBranch(this.repoPath, r)));

        commits.reverse();
        commits.forEach(commit => {
            this.repository.add(commit);
        });

        // console.log(commits);
    }
}

