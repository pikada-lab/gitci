import { JobStrategyBranch } from "./JobStrategyBranch";
import { JobStrategyTag } from "./JobStrategyTag";
import { JobStrategyNot } from "./JobStrategyNot";
import { JobStrategyOr } from "./JobStrategyOr";
import { JobStrategyAnd } from "./JobStrategyAnd";
import { JobStrategy } from "./JobStrategy";

/**
 * Преобразует строку в композицию классов стратегий  JobStrategyAnd, JobStrategyBranch, JobStrategyNot, JobStrategyOr, JobStrategyTag 
 * ```typescript
 * const strategy = ConditionParser("$branch like dev  OR ($tag like v1 AND $branch like test)");
 * strategy.hanlde(commit); // boolean
 * ```
 * 
 * ### Расширения
 * Для расширения функционала необходимо написать класс имплиментирующий интерфейс JobStrategy. 
 * Далее добавить в terms конструкцию и описать в factor конструкцию
 * 
 * ```
 *  if (__FUNCTION_FOR_RECOGNIZE_YOUR_CONSTRUCTION__(peek())) {
 *    return getStrategy(__YOUR_CLASS__);
 *  }
 *   ```
 * @param exor $branch like dev OR ($tag like v1 AND $branch like test)
 * @returns {JobStrategy} new JobStrategyOr(new JobStrategyBranch('dev), new JobStrategyAnd(new  JobStrategyTag('v1'), new  JobStrategyBranch('test')))
 */
export function ConditionParser(exor: string): JobStrategy {
    const terms = exor.match(/!|[()]|AND|OR|((?:\$branch|\$tag)\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/ig).map(t => t.replace(/(")/g, ''));
    const peek = () => terms[0] || ''
    const get = () => terms.shift();
    const accept = (...tokens) => tokens.includes(peek())
    const calc = (tokens, f) => {
        return accept(tokens) && get() && f();
    }

    const isBranch: (n: string) => boolean = (n) => /(\$branch\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/i.test(n)
    const isTag: (n: string) => boolean = (n) => /(\$tag\s*(?:not\s*)?like)\s*(\w{1}(?:[a-z0-9_\-\/])+)/i.test(n)

    const getVarible: (n: string) => string = (n) => n.replace(/((?:\$branch|\$tag)\s*(?:not\s*)?like)/i, '').trim();
    const isDenie: (n: string) => boolean = (n) => /(\snot\s)/i.test(n)
    const getStrategy = (cnst) => {
        let denie = isDenie(peek());
        const result = new cnst(getVarible(get()));
        if (denie) {
            return new JobStrategyNot(result);
        }
        return result;
    }
    const factor: () => JobStrategy = () => {

        if (isBranch(peek())) {
            return getStrategy(JobStrategyBranch);
        }

        if (isTag(peek())) {
            return getStrategy(JobStrategyTag);
        }

        if (accept('(')) {
            get();
            const result = exoression();
            get();
            return result;
        }
        if (accept('!')) {
            get();
            return new JobStrategyNot(factor());
        }
        return 0;
    }

    const term: () => JobStrategy = () => {
        let result = factor();
        while (accept("AND")) {
            calc('AND', () => result = new JobStrategyAnd(result, factor()))
        }
        return result;
    }

    const exoression: () => JobStrategy = () => {
        let result = term();
        while (accept("OR")) {
            calc('OR', () => result = new JobStrategyOr(result, term()))
        }
        return result;
    }
    return exoression();
};
