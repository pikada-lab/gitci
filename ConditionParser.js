
const ConditionParser = function(exor) {
    let terms = exor.match(/!|[()]|AND|OR|((?:\$branch|\$tag)\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/ig).map(t => t.replace(/(")/g, ''));
    let peek = () => terms[0] || ''
    let get  = () => terms.shift();
    let accept = (...tokens) => tokens.includes(peek())
    let calc   = (tokens, f) => { 
        return accept(tokens) && get() && f();
    }

    let isBranch = (n) => /(\$branch\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/i.test(n) 
    let isTag = (n) => /(\$tag\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/i.test(n) 
    let getVarible = (n) => n.replace(/((?:\$branch|\$tag)\s*(?:not\s*)?like)/i, '').trim();
    let isDenie = (n) => /(\snot\s)/i.test(n)
    let getStrategy = (cnst) => {
        let denie = isDenie(peek());
        const result = new cnst(getVarible(get()));
        if(denie) { 
            return new StrategyNot(result);
        }
        return result;
    }
    let factor = () => {

        if(isBranch(peek())) {
            return getStrategy(StrategyBranch);
        }

        if(isTag(peek())) {
            return getStrategy(StrategyTag);
        }

        if(accept('(')) {
            get();
            const result = exoression();
            get();
            return result;
        }
        if(accept('!')) {
            get();
            return new StrategyNot(factor());
        }
        return 0;
    }
 
    let term = () => {
        let result = factor();  
        while(accept("AND")) { 
            calc('AND', () => result = new StrategyAnd(result,factor())) 
        }
        return result;
    }

    let exoression = () => {
        let result = term();
        while(accept("OR")) {
            calc('OR', () => result = new StrategyOr(result,term())) 
        }
        return result;
    }
    return exoression();
}

class StrategyAnd {
    constructor(...strategy) {
        this.children = strategy;
    }
    toString() {
        return  this.children.join(" AND ");
    }
}

class StrategyOr {
    constructor(...strategy) {
        this.children = strategy;
    }
    toString() {
        return  "(" + this.children.join(" OR ") + ")";
    }
}

class StrategyNot {
    constructor(strategy) {
        this.children = strategy;
    }
    toString() {
        if(this.children.constructor.name == 'StrategyTag') {
            return this.children.toString().replace("like","not like")
        }
        if( this.children.constructor.name == 'StrategyBranch') {
            return this.children.toString().replace("like","not like")
        }
        return "!(" + this.children + ")";
    }
}

class StrategyTag {
    constructor(tag) {
        this.tag = tag;
    }
    toString() {
        return "$tag like " + this.tag;
    }
}

class StrategyBranch { 
    constructor(branch) {
        this.branch = branch;
    }

    toString() {
        return "$branch like " + this.branch;
    }
}

function assert(conditionString) {
    let resutl = ConditionParser( conditionString );
    let resutl2 = ConditionParser( resutl.toString() );
    console.log(resutl.toString() == resutl2.toString() ? "[+]" : "[-]", resutl.toString(),"===", resutl2.toString() );
}    

assert('$branch not like test'); 
assert('$branch like test');
assert('$branch like dev AND $tag like v2');
assert('!($branch like test AND $tag like v1) OR $branch like dev AND $tag like v2');
assert('($tag like v1 OR $tag like v2) AND $tag like v3');
assert('$tag like v1 OR $tag like v2');
 