/**
 * @file step.js, all data from server function here
 * @author aosyang<luckyfire@qq.com>
 */
const Log = console;
class StepEngine {
    constructor(name) {
        this._name = name;
        this._catch = 0;
        this._size = 0;
        this._steps = {};
    }
    _trace(...args) {
        Log.debug(`se-${this._name}`, ...args);
    }
    /**
     * 真正的执行步骤
     * @param {Promise<string>} p 下一步
     * @param {*} params 下一步的参数，下一步的参数有上一步的返回决定
     * @return {Object} 指向this
     * @note
     */
    _step(p, params = undefined) {
        return p.then(sp => {
            let {cb, id, name, alias} = this._steps[sp] || {};
            this._trace('step process:', sp, name, alias, id, params);
            if (!id) {
                this._trace('step process: all');
                return Promise.resolve(0);
            }
            try {
                this._trace('----------------------', cb);
                //
                // 1. 回掉cb，cb的返回结果如下：
                // (1) string 直接下下一步的名字
                // (2) [string, params] 下一步的名字，和下一步的参数
                // (3) Promise<[string, params]> 下一步的promise
                // (4) Promise<string> 下一步的promise
                // (5) undefined 默认的下一步
                // 后面的处理主要是结构出next 和 params
                //
                const callNext = rs => {
                    let rsc = Promise.resolve(undefined);
                    let rscp = undefined;
                    if (typeof rs === 'string') {
                        rsc = Promise.resolve(rs);
                    } else if (rs instanceof Array) {
                        rsc = Promise.resolve(rs[0]);
                        rscp = rs[1] || undefined;
                    }
                    this._trace('step next:', rsc, rscp);
                    return rsc.then(n => this._step(Promise.resolve(n || `sp-${id + 1}`), rscp));
                };
                let result = cb(params);
                if (result instanceof Promise) {
                    return result.then(callNext);
                } else {
                    return callNext(result);
                }
            } catch (e) {
                this._trace('step exception:', sp, e);
                return Promise.reject(e);
            }
        });
    }
    step(name, cb) {
        let alias = `sp-${++this._size}`;
        let sp = (name || alias);
        let val = {cb, id: this._size, name, alias};
        this._trace('add step:', name, alias);
        this._steps[sp] = val;
        this._steps[alias] = val;
        if (this._size === 1) {
            this._step(Promise.resolve(sp)).catch(e => {
                this._trace('step exception 1:', sp, e);
                this._catch && this._catch((e));
            });
        }
        return this;
    }
    sleep(tm = 0) {
        return this.step(`sleep${this._size}`, () => {
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, tm);
            });
        });
    }
    loop(step) {
        return this.step(`loop${this._size}`, () => step);
    }
    catch(cb) {
        this._catch = cb;
    }
}
class Test {
    constructor() {
        new StepEngine('SE').step('t1', () => {
            this.log('step-1');
        }).step('t2', () => {
            this.log('step-2');
            return ['t4', 't4params hereserser'];
        }).step('t3', () => {
            this.log('step-3');
        }).step('t4', () => {
            this.log('step-4');
        }).step('t5-promise', () => {
            return new Promise(resolve => resolve(0)).then(() => {
                this.log('promise', 'tiuemout');
            }).then(() => 't6').then(() => Promise.reject('reject error'));
        }).step('t6', () => false).catch(ex => {
            this.log('exception', ex);
        });
    }
    log(e) {
        console.log('++++', e, '++++');
    }
}
module.exports = name => new StepEngine(name);