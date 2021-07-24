import { Commit } from "../git/Commit";
import { JobHandler } from "./JobHandler";
import { Task } from "./Task";

export class JobProject {
    // Какие нужны программы -> чекнуть, есть ли они
    // путь к проекту

    private handlers: JobHandler[] = [];
    private task: Task[] = [];
    constructor(public readonly projectPath: string = "/", public readonly GitURL: string) {

    }
    addHandler(job: JobHandler) {
        this.handlers.push(job);
    }

    getHandlers() {
        return this.handlers;
    }

    setTask(task: Task) {
        this.task.push(task);
    }

    async execute() {
        let task = this.task.shift();
        if (!task) return console.log("NOT HAVE TASK");
        await task.start();
    }
}

