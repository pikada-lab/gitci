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


    stop() {
        if (this.bash) {
            this.bash.kill(9);
        }
    }
    async executed(path: string, environment: { [key: string]: string }) {

        return new Promise(async (resolve, reject) => {

            // spawn bash shell
            console.log(`START JOB: ${this.name}`);
            this.bash = spawn("/bin/bash", [], {
                // shell: false,
                env: Object.assign(process.env, {
                    "NODE_ENV": 'debug'
                }, environment),
                cwd: path
            });

            let result = "";
            this.bash.stdout.on("data", (text) => {
                result += text.toString('utf8');
                console.log(text?.toString("utf8"))
            });

            this.bash.stderr.on("data", (err) => {
                result += "> " + err?.toString("utf8") + "\n";
                console.log(err?.toString("utf8"))
                this.bash.kill(1);
                reject(err);
            });

            this.bash.on("close", (code) => {
                console.log(result?.toString());
                console.log(`END JOB with code ${code}: ${this.name}`);

                resolve(result);
            })

            for (let script of [...this.scripts, "exit"]) {
                await new Promise((res) => {
                    setTimeout(() => {
                        result += "$ " + script + "\n";
                        this.bash.stdin.write(script + "\n\n");
                        res(true);
                    }, 100)
                });
            }

        })
    }

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