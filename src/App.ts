import { Config } from "./Config";
import { NodeCI } from "./domains/job/NodeCI";

export class App {
    constructor(private config: Config) {
        console.log(this.config.get("path"), this.config.get("root"), this.config.get("timeout"));
    }

    async start() {

        // TEST    
        // project.setTask(new Task(gitService, project, handler));
        // console.log(handler.getLastCommit());
        // await fileStorage.save([project.getModel()]);

        let ci = new NodeCI(this.config);
        await ci.init();
    }
}

