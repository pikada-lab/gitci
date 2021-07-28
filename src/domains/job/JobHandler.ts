
import { Commit, CommitModel } from "../git/Commit";
import { Job, JobModel } from "./Job";

export class JobHandlerModel {
        strategy: string;
        job: JobModel;
        lastCommit: CommitModel;
}

export class JobHandler {


    private lastCommit: Commit;

    get LastCommit() {
        return this.lastCommit;
    }
    set LastCommit(commit: Commit) {
        this.lastCommit = commit;
    }

    constructor(
        private strategy: JobStrategy,
        private job: Job,
        private environment: { [key: string]: string }
    ) { }

    isHandle(commit: Commit) {
        if (!this.strategy.execute(commit)) return false;
        if (this.lastCommit && this.lastCommit.date >= commit.date) return false
        this.lastCommit = commit;
        return true;
    }

    async execute(path: string): Promise<void> {
        await this.job.executed(path, this.environment)
    }

    getModel(): JobHandlerModel {
        return {
            strategy: this.strategy.toString(),
            job: this.job.getModel(),
            lastCommit: this.lastCommit?.getModel()
        }
    }
}

export interface JobStrategy {
    execute(commit: Commit): boolean;
    toString(): string;
}

export class JobStrategyAnd implements JobStrategy {
    private strategies: JobStrategy[];
    constructor(...strategy: JobStrategy[]) {
        this.strategies = strategy;
    }
    execute(commit: Commit): boolean {
        return !~this.strategies.findIndex(r => !r.execute(commit));
    }

    toString() {
        return this.strategies.map(r => r.toString()).join(" AND ");
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

    toString() {
        return "(" + this.strategies.map(r => r.toString()).join(") OR (") + ")";
    }
}


export class JobStrategyNot implements JobStrategy {

    constructor(private strategy: JobStrategy) { }
    execute(commit: Commit): boolean {
        return !this.strategy.execute(commit);
    }
    toString() {
        return "!" + this.strategy.toString();
    }
}


export class JobStrategyTag implements JobStrategy {
    private tag: RegExp;
    constructor(private tagString: string) {
        this.tag = new RegExp(`(^|\s)(${tagString})(,|$)`, 'i');
    }

    execute(commit: Commit): boolean {
        return this.tag.test(commit.tag);
    }
    toString() {
        return "$tag like " + this.tagString.toString();
    }
}


export class JobStrategyBranch implements JobStrategy {

    constructor(private branch: string) {
    }
    execute(commit: Commit): boolean {
        return !!~commit.branch.findIndex(r => this.branch === r);
    }

    toString() {
        return "$branch like " + this.branch.toString();
    }
}

