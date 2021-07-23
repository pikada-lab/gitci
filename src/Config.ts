import { readFileSync } from "fs";
import { join, resolve } from "path";
export interface ConfigLike {
    path: string;
    root: string;
    timeout: number;
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
            return new Config(JSON.parse(data) as ConfigLike);
        } catch (ex) {
            console.log(ex.message);
            process.exit(1);
        }
    }

}
