export interface StepModel {
    name: string;
    text: string;
    scripts: string[];
}

export class Step {
 
    constructor(
        private name: string,
        private scripts: string[]
    ) { }
 
     
    toString() {
        return this.scripts.map(r => "$ " + r).join("\n");
    }

    getModel(): StepModel {
        return {
            name: this.name,
            text: this.toString(),
            scripts: this.scripts
        }
    }
}