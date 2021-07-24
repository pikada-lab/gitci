import { Commit } from "../git/Commit";
import gitSpawnedStream from 'git-spawned-stream';
import gitCommits from 'git-commits';
import streamToPromise from "stream-to-promise";
import { spawn } from "child_process";

export class GitService {


    private versionMajor = 2;
    private versionMinor = 24;
    private byteLimit = 5 * 1024 * 1024;

    async getCommitBranch(repoPath: string, commit: Commit) {
        let branch = await this.gitCommand(repoPath, "branch", "--contains", commit.hash);
        commit.setBranch(branch);
    }
    async gitCommand(repoPath: string, command: string, ...params: string[]) {
        const res = await streamToPromise(
            gitSpawnedStream( repoPath, [
                ...[command, ...params].filter(r => !!r)
            ], this.byteLimit));
        return res.toString('utf8');
    }


    async check() {
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