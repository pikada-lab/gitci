import { access, writeFile, readFile } from "fs/promises";

export class FileStorage<T> {
  db: T[] = [];
  constructor(private storeFile: string) {}

  async update() {
    // Создаём файл хранилища если его нет
    try {
      await access(this.storeFile);
      this.db = JSON.parse(await readFile(this.storeFile, "utf8"));
    } catch (ex) {
      await writeFile(this.storeFile, "[]");
      this.db = [];
    }
  }

  getAll(): T[] {
    return this.db;
  }

  async save(projects: T[]) {
    await writeFile(this.storeFile, JSON.stringify(projects), "utf8");
    this.db = projects;
  }
}
