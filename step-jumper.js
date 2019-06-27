/**
 * @file step.js, all data from server function here
 * @author aosyang<luckyfire@qq.com>
 */
const Log = console;
class StepJumper {
    constructor(name, initial) {
        this._steps = {};
        this._initial = initial;
        this._sizes = 0;
        this._roads = [];
        this._catch = err => this._trace(err)
    }
    _trace(...args) {
        Log.debug(`se-${this._name}`, ...args);
    }
    _next(name, params) {

        return Promise.resolve(this._run());
    }
    step(name, cb = (next, params) => 0) {
        const idx = ++this._sizes;
        const alias = `sp#${idx}#`;
        const sp = {name, cb, alias, idx};
        this._steps[alias] = sp;
        this._steps[name] = sp;
        return this;
    }
    _run(step, params) {
        const alias = `sp#${step}#`;
        let {name, cb} = this._steps[alias];
        try {
            cb(this._next.bind(this), params);
        } catch (err) {
            this._catch(err);
        }
    }
    run() {
        if (this._sizes === 0) {
            this._catch(new Error("no steps constructed"));
        } else {
            this._run(1, this._initial);
        }
        return this;
    }
    catch(cb) {
        this._catch = cb;
        return this;
    }
}

module.exports = name => new StepJumper(name);