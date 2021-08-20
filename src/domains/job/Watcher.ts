import { Commit } from "../git/Commit";
import { IGitService } from "./GitService";

export interface Watcherable {
  getPath(): string;
  addCommit(commit: Commit): void;
}
export enum WatcherStatus {
  ACTIVE = 1,
  STOP,
}

export class Watcher {
  private repoPath: string;

  private status = WatcherStatus.STOP;
  private timeStart: Date;
  private timeLastPull: Date;
  private timer: NodeJS.Timer;

  constructor(private gitService: IGitService, private project: Watcherable) {
    this.repoPath = this.project.getPath();
  }

  /**
   * Статус наблюдения за гит репозиторием
   * @returns Статус
   */
  getStatus() {
    return this.status;
  }
  /**
   * Время начала наблюдения за веткой гит после остановки
   * @returns Дата и время начала
   */
  getLastWatchStartingDate(): Date | null {
    return this.timeStart;
  }
  /**
   * Время запроса к гит репозиторию
   * @returns Дата и время последнего запроса pull
   */
  getLastPullingDate(): Date | null {
    return this.timeLastPull;
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.status = WatcherStatus.STOP;
  }

  async start() {
    if (this.status === WatcherStatus.STOP) {
      this.timeStart = new Date();
      this.status = WatcherStatus.ACTIVE;
    }
    await this.handle();
    if (WatcherStatus.ACTIVE) {
      await this.timeout(10000);
      await this.start();
    }
  }

  private async timeout(time: number) {
    return new Promise((res, rej) => {
      this.timer = setTimeout((_) => {
        res(true);
      }, time);
    });
  }

  async handle() {
    const branchResult = await this.gitService.gitCommand(
      this.repoPath,
      "branch",
      "--all"
    );
    this.timeLastPull = new Date();
    const branch = branchResult
      .split("\n")
      .filter((r) => /^(\*)\s/.test(r))[0]
      .replace("*", "")
      .trim();
    const response = await this.gitService.gitCommand(this.repoPath, "pull");

    // TODO: NOT GOOD CONDITION
    if (response.startsWith("Already up to date.")) {
      // TODO: Add last update time, count, time
    } else {
      const commits = await this.gitService.log(this.repoPath);
      commits.forEach((commit) => {
        this.project.addCommit(commit);
      });
    }
  }
}
