import { Commit } from "../domains/git/Commit";
import * as fs from "fs/promises";
import { Task, TaskStatus } from "../domains/job/Task";
import { UtilitiesService } from "../UtilitiesService";

describe("Task", () => {
    describe("configure", () => {
        it("should be PENDING", () => {
            let task = new Task("git://", new Commit());
            expect(task.getModel().status).toBe(TaskStatus.PENDING);
            expect(task.status).toBe(TaskStatus.PENDING);
        });
        it("should not be equal empty string", () => {

            let task = new Task("git://", new Commit());
            expect(task.getModel().path).not.toBe("");
        });
        it("should be prepared", async () => {

            let task = new Task("gie://", new Commit());
            let utilitiesService = new UtilitiesService();

            jasmine.setDefaultSpyStrategy(and => and.throwError(new Error("Do Not Call Me")));
            const program = jasmine.createSpyObj({
                clone: async (...str) => { 
                },
                gitCommand: async (...str) => {  
                }
            });
            jasmine.setDefaultSpyStrategy();

            // spyOn(fs, 'mkdir');

            await task.prepare(program, utilitiesService);

            expect(task.getModel().status).toBe(TaskStatus.PREPARING);
            expect(task.status).toBe(TaskStatus.PREPARING);
        })
        it("should be configure", () => {

            let task = new Task("git://", new Commit());
            task.configure("TEST OBJECT", [], { "key": "any value" })
            expect((task as any).environment).toEqual({ "key": "any value" });
        });
    });
})