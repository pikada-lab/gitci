import { readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { UtilitiesService } from "./UtilitiesService";
export interface ConfigLike {
    path: string;
    root: string;
    timeout: number;
    key: string;
    storeFile: string;
}
 
export class Config {
    private keyValueStore: Map<string, any> = new Map();
    constructor(configState: ConfigLike) {
        for (let [key, value] of Object.entries(configState)) {
            this.keyValueStore.set(key, value);
        }
        this.keyValueStore.set("root", resolve(join( __dirname, "..")));
    }

    get<T>(key: keyof ConfigLike): T {
        return this.keyValueStore.get(key) as T;
    }

    static initFile(file: string) {
        try {
            const data = readFileSync(file, { encoding: 'utf8' });
            let config = JSON.parse(data) as ConfigLike;

            if(!config.key) {
                config.key = new UtilitiesService().keyGen();
            }

            writeFileSync(file, JSON.stringify(config));
            console.log("authorization key:",config.key);

            return new Config(config);
        } catch (ex) {
            console.log(ex.message);
            process.exit(1);
        }
    }

}
