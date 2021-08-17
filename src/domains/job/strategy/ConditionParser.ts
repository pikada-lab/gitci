import { PipeStrategyBranch } from "./ PipeStrategyBranch";
import { PipeStrategyTag } from "./ PipeStrategyTag";
import { PipeStrategyNot } from "./ PipeStrategyNot";
import { PipeStrategyOr } from "./PipeStrategyOr";
import { PipeStrategyAnd } from "./ PipeStrategyAnd";
import { PipeStrategy } from "./PipeStrategy";

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
 * @returns {PipeStrategy} new JobStrategyOr(new JobStrategyBranch('dev), new JobStrategyAnd(new  JobStrategyTag('v1'), new  JobStrategyBranch('test')))
 */
export function ConditionParser(exor: string): PipeStrategy {
    try {
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
                return new PipeStrategyNot(result);
            }
            return result;
        }
        const factor: () => PipeStrategy = () => {

            if (isBranch(peek())) {
                return getStrategy(PipeStrategyBranch);
            }

            if (isTag(peek())) {
                return getStrategy(PipeStrategyTag);
            }

            if (accept('(')) {
                get();
                const result = exoression();
                get();
                return result;
            }
            if (accept('!')) {
                get();
                return new PipeStrategyNot(factor());
            }
            return 0;
        }

        const term: () => PipeStrategy = () => {
            let result = factor();
            while (accept("AND")) {
                calc('AND', () => result = new PipeStrategyAnd(result, factor()))
            }
            return result;
        }

        const exoression: () => PipeStrategy = () => {
            let result = term();
            while (accept("OR")) {
                calc('OR', () => result = new PipeStrategyOr(result, term()))
            }
            return result;
        }
        return exoression();
    } catch (ex) {
        throw new Error("Condition is not valid");
    }
};
