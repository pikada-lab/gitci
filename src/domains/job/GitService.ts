import { Commit } from "../git/Commit";
import gitCommits from 'git-commits';
import streamToPromise from "stream-to-promise";
import { spawn } from "child_process";
import run from 'spawn-to-readstream';
import { join } from "path";


export interface IGitService {
    getCommitBranch(repoPath: string, commit: Commit): Promise<void>;
    log(repoPath: string): Promise<Commit[]>;
    clone(repoPath: string, remoteGitHTTP: string, branch?: string): Promise<string>;
    gitCommand(repoPath: string, command: string, ...params: string[]): Promise<string>;
    check(): Promise<boolean>;
}
export class GitService implements IGitService {

    private versionMajor = 2;
    private versionMinor = 24;
    private limitSize = 5 * 1024 * 1024; // 5 Mb
    async getCommitBranch(repoPath: string, commit: Commit) {
        let branch = await this.gitCommand(repoPath, "branch", "--contains", commit.hash);
        commit.setBranch(branch);
    }

    async log(repoPath: string): Promise<Commit[]> {
        let commitsObject = await streamToPromise(gitCommits(join(repoPath, ".git"), { limit: 1000 }));
        const commits = commitsObject.map(r => new Commit().setRef(r)) as Commit[];
        await Promise.all(commits.map(r => this.getCommitBranch(repoPath, r)));
        return commits;
    }

    async clone(repoPath: string, remoteGitHTTP: string, branch?: string) {
        const arg = [
            'clone', remoteGitHTTP
        ];
        if (branch) {
            arg.push('--branch', branch, '--single-branch');
        }
        console.log("EXECUTE COMMAND (clone) git ", arg);
        // console.time("ExecuteCommandGit")
        const child = spawn('git', arg, { cwd: repoPath });
        const result = await streamToPromise(run(child, this.limitSize));
        // console.timeEnd("ExecuteCommandGit")
        return result.toString('utf8');
    }

    async gitCommand(repoPath: string, command: string, ...params: string[]) {
        const res = await this.command(repoPath, [command, ...params].filter(r => !!r));
        return res.toString('utf8');
    }

    private async command(repoPath: string, command: string[]): Promise<Buffer> {
        const arg = [`--git-dir=${repoPath}/.git`, `--work-tree=${repoPath}`].concat(command);
        const child = spawn('git', arg);
        const result = await streamToPromise(run(child, this.limitSize));
        return result;
    }

    async check(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const git = spawn("git", ["--version"]);
            git.stdout.on("data", (chunk: Buffer) => {
                const version = /(\d+)\.(\d+)\.\d+/i.exec(chunk.toString("utf8").substr(12, 7));
                if (!version || !version[1] || !version[2]) {
                    return reject("version problem");
                }
                if (+version[1] == this.versionMajor && +version[2] >= this.versionMinor) {
                    console.log("SUCCESS VERSION");
                    resolve(true);
                } else {
                    console.log("VERSION NOT SUPPORT");
                    resolve(false);
                }
                git.kill();
            });
            git.stderr.on("data", (err) => {
                git.kill();
                reject(err);
            })
        })
    }
}