import { JobProject } from "./JobProject";
import { JobHandler, JobStrategyBranch } from "./JobHandler";
import { Job } from "./Job";

export class ProjectService {
    private projects: JobProject[] = [];
    constructor() {
    }
    async add(project: JobProject) {
        try { 
            if (!project.GitURL) throw new Error("Нет ссылки на удалённый репозиторий"); 
            this.projects.push(project);
            // из базы данных подгружаем подробности по задачам и работам
            const strategy = new JobStrategyBranch("master"); //new JobStrategyOr(new JobStrategyBranch("dev"), new JobStrategyBranch("test"));
            const handler = new JobHandler(strategy,
                new Job("Test job", [
                    "export TOKEN_ICQ=001.0232927109.1999608478:751212693",
                    "npm ci",
                    "npm install typescript",
                    "npm install codecov ",
                    "tsc",
                    "npm test",
                    "codecov -f coverage/*.json"
                ]), { "PORT": "3031" });
            project.addHandler(handler);
            console.log(project.getModel());
            return true;

        } catch (ex) {
            console.log(ex.message, ex);
            return false;
        }
    }

    getProjects() {
        return this.projects;
    }
}