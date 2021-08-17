const ConditionParser = function (exor) {
    try {
        const terms = exor.match(/!|[()]|AND|OR|((?:\$branch|\$tag)\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/ig).map(t => t.replace(/(")/g, ''));
        const peek = () => terms[0] || ''
        const get = () => terms.shift();
        const accept = (...tokens) => tokens.includes(peek())
        const calc = (tokens, f) => {
            return accept(tokens) && get() && f();
        }

        const isBranch = (n) => /(\$branch\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/i.test(n)
        const isTag = (n) => /(\$tag\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/i.test(n)
        const getVarible = (n) => n.replace(/((?:\$branch|\$tag)\s*(?:not\s*)?like)/i, '').trim();
        const isDenie = (n) => /(\snot\s)/i.test(n)
        const getStrategy = (cnst) => {
            let denie = isDenie(peek());
            const result = new cnst(getVarible(get()));
            if (denie) {
                return new StrategyNot(result);
            }
            return result;
        }
        const factor = () => {

            if (isBranch(peek())) {
                return getStrategy(StrategyBranch);
            }

            if (isTag(peek())) {
                return getStrategy(StrategyTag);
            }

            if (accept('(')) {
                get();
                const result = exoression();
                get();
                return result;
            }
            if (accept('!')) {
                get();
                return new StrategyNot(factor());
            }
            return 0;
        }

        const term = () => {
            let result = factor();
            while (accept("AND")) {
                calc('AND', () => result = new StrategyAnd(result, factor()))
            }
            return result;
        }

        const exoression = () => {
            let result = term();
            while (accept("OR")) {
                calc('OR', () => result = new StrategyOr(result, term()))
            }
            return result;
        }
        return exoression();
    } catch (ex) {
        throw new Error("Error parse");
    }
};

class StrategyAnd {
    constructor(...strategy) {
        this.children = strategy;
    }


    handle(commit) {
        return !~this.children.findIndex(r => !r.handle(commit));
    }

    toString() {
        return this.children.join(" AND ");
    }
}

class StrategyOr {
    constructor(...strategy) {
        this.children = strategy;
    }

    handle(commit) {
        return !!~this.children.findIndex(r => r.handle(commit));
    }

    toString() {
        return "(" + this.children.join(" OR ") + ")";
    }
}

class StrategyNot {
    constructor(strategy) {
        this.children = strategy;
    }

    handle(commit) {
        return !this.children.handle(commit);
    }

    toString() {
        if (this.children.constructor.name == 'StrategyTag') {
            return this.children.toString().replace("like", "not like")
        }
        if (this.children.constructor.name == 'StrategyBranch') {
            return this.children.toString().replace("like", "not like")
        }
        return "!(" + this.children + ")";
    }
}

class StrategyTag {
    constructor(tag) {
        this.tag = tag;
        this.exp = new RegExp("(" + this.tag + ")", "i");
    }

    handle(commit) {
        return this.exp.test(commit.tag)
    }

    toString() {
        return "$tag like " + this.tag;
    }
}

class StrategyBranch {
    constructor(branch) {
        this.branch = branch;
        this.exp = new RegExp("(" + this.branch + ")", "i");
    }

    handle(commit) {

        return !!(~commit.branch.findIndex(r => this.exp.test(r)));
    }

    toString() {
        return "$branch like " + this.branch;
    }
}

function assert(conditionString) {
    let resutl = ConditionParser(conditionString);
    let resutl2 = ConditionParser(resutl.toString());
    console.log(resutl.toString() == resutl2.toString() ? "[+]" : "[-]", resutl.toString(), "===", resutl2.toString());
}
function assertModel(conditionString, commit, result) {
    let cond = ConditionParser(conditionString);
    console.log(cond.handle(commit) === result ? "[+]" : "[-]", conditionString);

}

assert('$branch not like test');
assert('$branch like test');
assert('$branch like dev AND $tag like v2');
assert('!($branch like test AND $tag like v1) OR $branch like dev AND $tag like v2');
assert('($tag like v1 OR $tag like v2) AND $tag like v3');
assert('$tag like v1 OR $tag like v2');

// commits

assertModel('$branch like test', { branch: ['test'], tag: '' }, true)
assertModel('$branch like test', { branch: ['release'], tag: '' }, false)
assertModel('$branch not like test', { branch: ['test'], tag: '' }, false)
assertModel('$branch not like test', { branch: ['release'], tag: '' }, true)


assertModel('$tag like test', { branch: ['release'], tag: 'test' }, true)
assertModel('$tag like test', { branch: ['release'], tag: 'release' }, false)
assertModel('$tag not like test', { branch: ['release'], tag: 'test' }, false)
assertModel('$tag not like test', { branch: ['release'], tag: 'release' }, true)


assertModel('$tag like test AND $branch like test', { branch: ['release'], tag: 'release' }, false)
assertModel('$tag like test AND $branch like test', { branch: ['release'], tag: 'test' }, false)
assertModel('$tag like test AND $branch like test', { branch: ['test'], tag: 'release' }, false)
assertModel('$tag like test AND $branch like test', { branch: ['test'], tag: 'test' }, true)


assertModel('$tag like test AND $branch like test OR $tag like hot', { branch: ['release'], tag: 'hot' }, true)
assertModel('$tag like test AND $branch like test OR $tag like hot', { branch: ['test'], tag: 'release' }, false)
assertModel('$tag like test AND $branch like test OR $tag like hot', { branch: ['release'], tag: 'test' }, false)
assertModel('$tag like test AND $branch like test OR $tag like hot', { branch: ['test'], tag: 'test' }, true)


assertModel('$tag like test AND ($branch like test OR $branch like hot)', { branch: ['release'], tag: 'hot' }, false)
assertModel('$tag like test AND ($branch like test OR $branch like hot)', { branch: ['hot'], tag: 'test' }, true)
assertModel('$tag like test AND ($branch like test OR $branch like hot)', { branch: ['release'], tag: 'release' }, false)
assertModel('$tag like test AND ($branch like test OR $branch like hot)', { branch: ['test'], tag: 'test' }, true)
assertModel('$tag like test AND ($branch like test OR $branch like hot)', { branch: ['test', 'hot'], tag: 'test' }, true)
assertModel('$tag like test AND ($branch like test OR $branch like hot)', { branch: ['branch', 'note'], tag: 'test' }, false)

let r = ConditionParser("$tag = test");
console.log(r);