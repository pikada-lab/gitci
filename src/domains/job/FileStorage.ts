import { access, writeFile, readFile } from "fs/promises";
import { ProjectModel } from "./JobProject";

export class FileStorage {
    db: ProjectModel[] = []; 
    constructor(private storeFile: string) { }

    async update() {
        // Создаём файл хранилища если его нет 
        try {
            await access(this.storeFile);
            this.db = JSON.parse((await readFile(this.storeFile, 'utf8'))); 
        } catch (ex) {
            await writeFile(this.storeFile, "[]");
            this.db = []; 
        }
    }

    getAll(): ProjectModel[] {
        return this.db;
    }

    async save(projects: ProjectModel[]) {
        await writeFile(this.storeFile, JSON.stringify(projects), 'utf8'); 
        this.db = projects;
    }


}