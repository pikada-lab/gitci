import { ChildProcess, spawn } from "child_process";

export interface JobModel {
    name: string;
    text: string;
    scripts: string[];
}

export class Job {

    private bash: ChildProcess;
    constructor(
        private name: string,
        private scripts: string[]
    ) { }
 
     
    toString() {
        return this.scripts.map(r => "$ " + r).join("\n");
    }

    getModel(): JobModel {
        return {
            name: this.name,
            text: this.toString(),
            scripts: this.scripts
        }
    }
}