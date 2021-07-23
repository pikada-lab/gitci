import { spawn } from "child_process";
import { Commit } from "../git/Commit";

export class JobSetting {

    private versionMajor = 2;
    private versionMinor = 24;
    constructor(
        private strategy: JobStrategy,
        public readonly timeout: number = 60,
        public readonly projectPath: string = "/") {

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
    isHandle(commit: Commit) {
       return this.strategy.execute(commit);
    }


}

export interface JobStrategy {
    execute(commit: Commit): boolean;
}

export class JobStrategyAnd implements JobStrategy {
    private strategies: JobStrategy[];
    constructor(...strategy: JobStrategy[]) {
        this.strategies = strategy;
    }
    execute(commit: Commit): boolean {
        return !~this.strategies.findIndex(r => !r.execute(commit));
    }
}


export class JobStrategyOr implements JobStrategy {
    private strategies: JobStrategy[];
    constructor(...strategy: JobStrategy[]) {
        this.strategies = strategy;
    }
    execute(commit: Commit): boolean {
        return !!~this.strategies.findIndex(r => r.execute(commit));
    }
}


export class JobStrategyNot implements JobStrategy {

    constructor(private strategy: JobStrategy) { }
    execute(commit: Commit): boolean {
        return !this.strategy.execute(commit);
    }
}


export class JobStrategyTag implements JobStrategy {
    private tag: RegExp;
    constructor(tag: string) {
        this.tag = new RegExp(`(^|\s)(${tag})(,|$)`, 'i');
    }

    execute(commit: Commit): boolean {
        return this.tag.test(commit.tag);
    }
}


export class JobStrategyBranch implements JobStrategy {
    private branch: RegExp;
    constructor(branch: string) {
        this.branch = new RegExp(`(^|\s)(${branch})(,|$)`, 'i');
    }
    execute(commit: Commit): boolean {
        return this.branch.test(commit.branch);
    }
}

