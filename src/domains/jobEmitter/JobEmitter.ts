import { JobSetting } from "../job/JobSetting";
import { join, resolve } from "path";
import { Commit } from "../git/Commit";

import gitSpawnedStream from 'git-spawned-stream';

export class JobEmitter {
    private repoPath: string;
    private byteLimit = 5 * 1024 * 1024;
    constructor(jobSetting: JobSetting) {
        this.repoPath = resolve(join(jobSetting.projectPath, '/.git'));
    }

    async handle() {
        const res = await streamToPromise(gitSpawnedStream(this.repoPath, [
            'restore --all'
        ], this.byteLimit));
        console.log(res);
        const stream = gitSpawnedStream(this.repoPath, [
            'pull'
        ], this.byteLimit);
        stream.on('data', function (data) {
            console.log('DATA', data.toString('utf8'));
        }).on('error', function (err) {
            console.error('An error occurred:');
            console.error('-----------------\n');
            console.error(err.message);
            process.exit(1);
        }).on('end', function (killed) {
            // when the stream is cut, killed === true
            console.log("\n±±±±±±±±±±±±±±±±±\nThat's all folks!");
        });

    }
}

function streamToPromise(arg0: any) {
    throw new Error("Function not implemented.");
}
