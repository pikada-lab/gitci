
import { Commit } from "../git/Commit";
import { Job } from "./Job";

export class JobHandler { 

    private lastCommit: Commit;

    constructor(
        private strategy: JobStrategy,
        private job: Job) {

    }
 
    isHandle(commit: Commit) {
        return this.strategy.execute(commit);
    }


    setLastCommit(commit: Commit) {
        this.lastCommit = commit;
    }

    getLastCommit(): Commit {
        return this.lastCommit;
    }

    async execute(): Promise<void> {
        await this.job.executed()
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
    private branch: string;
    constructor(branch: string) {
        this.branch = branch;
    }
    execute(commit: Commit): boolean {
        return !!~commit.branch.findIndex(r => {
            console.log(this.branch, r, this.branch === r)
           return this.branch === r
        });
    }
}

