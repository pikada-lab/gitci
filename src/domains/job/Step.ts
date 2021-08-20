export interface StepModel {
  id: string;
  name: string;
  text: string;
  scripts: string[];
}

export class Step {
  constructor(
    private id: string,
    private name: string,
    private scripts: string[]
  ) {}

  getID() {
    return this.id;
  }

  toString() {
    return this.scripts.map((r) => "$ " + r).join("\n");
  }

  getModel(): StepModel {
    return {
      id: this.id,
      name: this.name,
      text: this.toString(),
      scripts: this.scripts,
    };
  }
}
