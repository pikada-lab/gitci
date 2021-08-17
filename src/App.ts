import { Config } from "./Config";
import { NodeCI } from "./domains/job/NodeCI";

export class App extends NodeCI {
    constructor(config: Config) {
        super(config);
    }

    async start() {  
        await this.init();
    }
}

