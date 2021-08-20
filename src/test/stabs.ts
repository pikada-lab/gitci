import { Commit } from "../domains/git/Commit";
import { GitService, IGitService } from "../domains/job/GitService";
import { Watcherable } from "../domains/job/Watcher";

export const TestWatcher: Watcherable = {
  getPath: function () {
    return "/tmp/path";
  },
  addCommit: function (commit: Commit) {
    this.cb?.(commit);
  },
};

export const TestGitService: IGitService = {
  getCommitBranch: function (repoPath: string, commit: Commit) {
    commit.setBranch("master");
    return Promise.resolve();
  },
  log: function (repoPath: string) {
    return Promise.resolve([new Commit().setBranch("dev")]);
  },
  clone: function (repoPath: string, remoteGitHTTP: string, branch?: string) {
    return Promise.resolve("");
  },
  gitCommand: function (
    repoPath: string,
    command: string,
    ...params: string[]
  ) {
    if (command === "branch") return Promise.resolve("* master\n  dev");
    if (command == "pull") return Promise.resolve("Already up to date.");
  },
  check: function () {
    return Promise.resolve(true);
  },
};
export const TestGitServicePull: IGitService = {
  getCommitBranch: function (repoPath: string, commit: Commit) {
    commit.setBranch("master");
    return Promise.resolve();
  },
  log: function (repoPath: string) {
    return Promise.resolve([new Commit().setBranch("dev")]);
  },
  clone: function (repoPath: string, remoteGitHTTP: string, branch?: string) {
    return Promise.resolve("");
  },
  gitCommand: function (
    repoPath: string,
    command: string,
    ...params: string[]
  ) {
    if (command === "branch") return Promise.resolve("* master\n  dev");
    if (command == "pull") return Promise.resolve("commit");
  },
  check: function () {
    return Promise.resolve(true);
  },
};
