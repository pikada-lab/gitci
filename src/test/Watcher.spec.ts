import { Watcher, WatcherStatus } from "../domains/job/Watcher";
import { TestGitService, TestGitServicePull, TestWatcher } from "./stabs";
import { timeout } from "./utils";

describe("Watcher.", () => {

    const project = TestWatcher;
    const service = TestGitService;
    const servicePull = TestGitServicePull;
    describe("start()", () => {

        const watcher = new Watcher(service, project);
        it("shoul be changed status to Start", async () => {
            expect(watcher.getStatus()).toEqual(WatcherStatus.STOP);
            watcher.start();
            await timeout(10);
            expect(watcher.getStatus()).toEqual(WatcherStatus.ACTIVE);
        })
    });
    describe("stop()", () => {
        const watcher = new Watcher(service, project);
        it("shoul be changed status to Stop", async () => {
            watcher.stop();
            await timeout(10);
            expect(watcher.getStatus()).toEqual(WatcherStatus.STOP);
        })
    });
    describe("getLastPullingDate()", () => {
        const watcher = new Watcher(service, project);
        it("shoul be between 100ms", async () => {
            watcher.start();
            await timeout(10);
            watcher.stop();
            expect(watcher.getLastPullingDate().getTime()).toBeLessThan(Date.now());
            expect(watcher.getLastPullingDate().getTime()).toBeGreaterThan(Date.now() - 100);
        })
    });
    describe("getLastWatchStartingDate()", () => {
        const watcher = new Watcher(service, project);
        it("shoul be between 100ms", async () => {
            watcher.start();
            await timeout(10);
            watcher.stop();
            expect(watcher.getLastWatchStartingDate().getTime()).toBeLessThan(Date.now());
            expect(watcher.getLastWatchStartingDate().getTime()).toBeGreaterThan(Date.now() - 100);
        })
    });
    describe("start()", () => {
        const watcher = new Watcher(servicePull, project);
        it("shoul be add commit", async () => {
            spyOn(project, 'addCommit')
            watcher.start();
            await timeout(10);
            expect((project.addCommit as any).calls.count()).toEqual(1)
        });
    });

    describe("repoPath", () => {
        const watcher = new Watcher(service, project);
        it("shoul be /tmp/path", () => {
            expect((watcher as any).repoPath).toEqual("/tmp/path");
        });
    });

});