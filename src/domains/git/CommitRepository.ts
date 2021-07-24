import { EventEmitter } from "stream";
import { Commit } from "./Commit";

export class CommitRepository {
    private HASH_INDEX = new Map<string, Commit>();
    private BRANCH_INDEX = new Map<string, Commit[]>();
    private commits = [];
    public events = new EventEmitter();
    constructor() {
    }

    clear() {
        this.HASH_INDEX.clear();
        this.BRANCH_INDEX.clear();
        this.commits = [];
    }

    add(commit: Commit) {
        if (this.HASH_INDEX.has(commit.hash)) return;
        commit.branch.forEach(branch => {
            if (!this.BRANCH_INDEX.get(branch)) {
                !this.BRANCH_INDEX.set(branch, [commit])
            } else {
                let branckCollection = this.BRANCH_INDEX.get(branch)
                branckCollection.push(commit);
            }
        })
        this.HASH_INDEX.set(commit.hash, commit);
        this.commits.push(commit);
        this.events.emit("after_add", commit);
    }

    getByHash(hash: string): Commit {
        return this.HASH_INDEX.get(hash);
    }

    getByBranch(branch: string): Commit[] {
        return this.BRANCH_INDEX.get(branch);
    }

    getAll() {
        return this.commits;
    }

}