/**
 * @file step-engine.js, 步骤引擎，可以实现跳步。循环，延时等操作
 * @author aosyang<luckyfire@qq.com>
 */

const { P, E, F } = require("./func-extends");

let seins = 1;

const Log = console;
class StepFlow {
  constructor(name) {
    this._name = name || `se#${seins++}#`;
    this._catch = err => Log.error(err);
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
      let { cb, id, name, alias } = this._steps[sp] || {};
      this._trace("step process:", sp, name, alias, id, params);
      if (id === undefined) {
        this._trace("step process: all");
        return P(0);
      }
      try {
        this._trace("----------------------", cb);
        //
        // 1. 回掉cb，cb的返回结果如下：
        // (1) string 直接下下一步的名字
        // (2) [string, params] 下一步的名字，和下一步的参数
        // (3) Promise<[string, params]> 下一步的promise
        // (4) Promise<string> 下一步的promise
        // (5) undefined 默认的下一步
        // 后面的处理主要是结构出next 和 params
        //
        return P(cb(params)).then(ret => {
            if (ret === undefined) {
                ret = {s: `sp-${id + 1}`};
            } else if (ret instanceof Array) {
                ret = {s: ret[0], p: ret[1] || undefined};
            } else if (typeof ret === 'string') {
                ret = {s: ret};
            } else {
                ret = {}
            }
            let {s, p} = ret;
            return this._step(P(s), p);
        }).catch(err => this._catch(err));
      } catch (e) {
        this._trace("step exception:", sp, e);
        return Promise.reject(e);
      }
    });
  }
  step(name, cb) {
    let alias = `sp-${++this._size}`;
    let sp = name || alias;
    let val = { cb: F(cb), id: this._size, name, alias };
    this._trace("add step:", name, alias);
    this._steps[sp] = val;
    this._steps[alias] = val;
    if (this._size === 1) {
      this._step(P(sp)).catch(e => {
        this._trace("step exception 1:", sp, e);
        this._catch && this._catch(e);
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

/**
 * 创建一个步骤引擎实例
 * @param {*} name 实例的名字
 */
const Flow = name => new StepFlow(name);
const L = Flow;

class Test {
  constructor() {
    new StepFlow()
      .step("t1", () => {
        this.log("step-1");
      })
      .step("t2", () => {
        this.log("step-2");
        return ["t4", "t4params hereserser"];
      })
      .step("t3", () => {
        this.log("step-3");
      })
      .step("t4", () => {
        this.log("step-4");
      })
      .step("t5-promise", () => {
        return new Promise(resolve => resolve(0))
          .then(() => {
            this.log("promise", "tiuemout");
          })
          .then(() => "t6")
          .then(() => Promise.reject("reject error"));
      })
      .step("t6", () => false)
      .catch(ex => {
        this.log("exception", ex);
      });
  }
  log(e) {
    console.log("++++", e, "++++");
  }
}
// new Test();
module.exports = {
    Flow, L
};
