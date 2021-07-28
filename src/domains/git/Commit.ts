export interface CommitModel {
    hash: string;
    parent: string[];
    author: string;
    date: Date;
    comment: string;
    branch: string[];
    tag: string;
}

export class Commit {

    hash: string = "91ac363652d2d99bbc92d8b27c56fe23b84350f0";
    parent: string[] = [];
    author: string = "Anton A Dzhigurda <info@fake-mm.ru>";
    date: Date = new Date("2021-07-23 13:57:14");
    comment: string = "git init ignore ... text";

    branch: string[] = [];
    tag: string;
    setRef(commit: any) {
        this.hash = commit.hash;
        this.author = `${commit.author.name} <${commit.author.email}>`;
        this.date = new Date(commit.author.timestamp * 1000);
        this.comment = commit.title + (commit.description ? "\n\n" + commit.description : "");
        this.parent = commit.parents;
        return this;
    }
    setBranch(branch: string) {
        this.branch = branch.replace("*", "").split("\n").map(r => r.trim()).filter(r => r);
    }
    setTag(tag: string) {
        this.tag = tag.trim();
    }

    getModel(): CommitModel {
        return {
            hash: this.hash.substr(this.hash.length - 6),
            parent: this.parent.map(hash => hash.substr(hash.length - 6)),
            author: this.author,
            date: this.date,
            comment: this.comment,
            branch: this.branch,
            tag: this.tag
        }
    }
}