export class JobSetting {
    strategy: JobStrategy;
}

export interface JobStrategy {
    execute(): boolean;
}

export class JobStrategyAnd implements JobStrategy {
    private strategies: JobStrategy[];
    constructor( ...strategy: JobStrategy[]) {
        this.strategies = strategy;
    }
    execute(): boolean {
        return !~this.strategies.findIndex(r => !r.execute());
    }
}


export class JobStrategyOr implements JobStrategy {
    private strategies: JobStrategy[];
    constructor( ...strategy: JobStrategy[]) {
        this.strategies = strategy;
    }
    execute(): boolean {
        return !~this.strategies.findIndex(r => r.execute());
    }
}


export class JobStrategyNot implements JobStrategy {
 
    constructor(private strategy: JobStrategy) { }
    execute(): boolean {
        return !this.strategy.execute();
    }
}


export class JobStrategyTag implements JobStrategy {
    private tags: string[];
    constructor(...tag: string[]) {
        this.tags = tag;
    }
    execute(): boolean {
        
    }
}


export class JobStrategyBranch implements JobStrategy {
    constructor() {
        
    }
    execute(): boolean {
        
    }
}