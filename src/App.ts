import { Config } from "./Config";

export class App {
    constructor(private config: Config) {
        console.log(this.config.get("path"), this.config.get("root"), this.config.get("timeout"));
    }
   async start() {
    
    }
    stop() {

    }
}

