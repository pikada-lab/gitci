import { spawn } from "child_process"; 

export interface JobModel {
    name: string;
    text: string;
    scripts: string[];
}

export class Job {

    constructor(
        private name: string,
        private scripts: string[]
    ) { }

    async executed(path: string, environment: { [key: string]: string }) {

        return new Promise(async (resolve, reject) => {
 
            // spawn bash shell
            console.log(`START JOB: ${this.name}`);
            const bash = spawn("/bin/bash", [], {
                // shell: false,
                env: Object.assign(process.env, {
                    "NODE_ENV": 'debug'
                }, environment),
                cwd: path
            });

            let result = "";
            bash.stdout.on("data", (text) => {
                result += text.toString('utf8');
            });

            bash.stderr.on("data", (err) => {
                result += "> " + err?.toString("utf8") + "\n";
                bash.kill(1);
                reject(err);
            });

            bash.on("close", (code) => {
                console.log(result?.toString());
                console.log(`END JOB with code ${code}: ${this.name}`);

                resolve(result);
            })

            for (let script of [...this.scripts, "exit"]) {
                await new Promise((res) => {
                    setTimeout(() => {
                        result += "$ " + script + "\n";
                        bash.stdin.write(script + "\n\n");
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