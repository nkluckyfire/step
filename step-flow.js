/**
 * @file step-flow.js, 基于promise的调用编排框架
 * @author aosyang<luckyfire@qq.com>
 */

 /**
  * 对函数生成签名副本，不同于原函数，会有额外输入参数，主要用于Chain串联操作
  */
Function.prototype.s = function(...args) {
    return arg => {
        args = arg === undefined ? args : [arg].concat(args);
        return this(...args);
    }
}

const FunctionSure = v => typeof v === 'function' ? v : () => v;
const F = FunctionSure;

Function.prototype._hcall = function(...args) {
    this.__bf__ && this.__bf__.map(f => f(...args));
    let ret = this(...args);
    this.__af__ && this.__af__.map(f => f(ret));
    return ret;
}

Function.prototype.bf = function(cb) {
    this.__bf__ = this.__bf__ || [];
    this.__bf__.push(F(cb));
    return this._hcall.bind(this);
}

Function.prototype.af = function(cb) {
    this.__af__ = this.__af__ || [];
    this.__af__.push(F(cb));
    return this._hcall.bind(this);
}


/**
 * 将输入转换为一个promise
 * @param {*} any 任意输入，可以是对象或者po甚至函数 
 */
const PromiseSure = any => Promise.resolve(any);
const P = PromiseSure;

/**
 * 将输入v进行遍历解除，规则是如果v是函数，则尝试获取函数调用结果
 * @param {*} v 任意输入，可以是函数
 */
const ExtractFunction = v => {
    while(typeof v === 'function') {
        v = v();
    }
    return v;
};
const E = ExtractFunction;

/**
 * 编组调用，输入是函数，函数签名，对象，PO等
 * @param  {...any} fs 输入
 */
const Group = (...fs) => {
    return () => Promise.all(fs.map(v => P(E(v))));
};
const G = Group;

/**
 * 辅助串联函数
 * @param {*} cbs 回调
 * @param {*} idx 索引
 * @param {*} arg 参数
 */
const _Chain = (cbs, idx, arg) => {
    if (idx < cbs.length) {
        let v = (cbs[idx]);
        if (typeof v === 'function') {
            arg = (v)(arg);
        } else if (typeof v === 'string') {
            arg = (new Function('arg', '{ return `' + v + '`}'))(arg);
        } else {
            arg = v;
        }
        return P(arg).then(r => _Chain(cbs, idx + 1, r));
    }
    return P(arg);
}

/**
 * 串联操作
 * @param  {...any} fs 输入任意
 */
const Chain = (...fs) => () => _Chain(fs, 0, null);
const C = Chain;

/**
 * 映射操作，主要针对Group的结果进行映射修改，类似Array的mao
 * @param {*} gs Group的返回值
 * @param {*} cb 针对group中的每一个值操作
 */
const Map = (gs, cb = (val, idx) => 0) => {
    return () => gs().then(r => r.map(cb));
}
const M = Map;

/**
 * 先group，再chain
 * @param {*} reduce chain函数
 * @param  {...any} gs group操作
 */
const Chord = (reduce, ...gs) => {
    return () => G(...gs)().then(r => reduce(r));
};
const H = Chord;

/**
 * 类似group，但是每一个promise都有独立的回掉
 * @param {*} cb 独立回掉
 * @param  {...any} fs promise参数
 */
const AnyOne = (cb = (val, idx) => val, ...fs) => {
    return G(...fs.map((v, i) => P(E(v)).then(vs => cb(vs, i))));
}
const A = AnyOne;

const vs = v => console.log(v);

function test_all() {
    C(1, () => 2, '${arg + 1}', ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 31
    C(1, () => 2, '${arg + 1}', arg => Number(arg), ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 4
    G(1, () => 2, 3, () => () => () => 4)().then(vs); // output: [1, 2, 3, 4]
    H(arr => arr, 1, 2, 3, 4, 5, 6, 7)().then(vs); // output: [1,2,3,4,5,6,7]
    M(G(1,2, C(3, 4, 5), 6, C(7, arg => arg * 10), () => 8), v => v * 10)().then(vs); // output: [10, 20, 50, 60, 700, 80]
    AnyOne((v, i) => console.log(v, i), 1, 2, 3, 4 ,5)().then(vs); // output: [undefined, undefined, undefined, undefined, undefined]
}

function test_hook(a, b, c) {
    console.log("test-hook", a, b, c);
    return a + b +c;
}

// test_hook.bf((a, b, c) => console.log("test-hook-before", a, b, c)).af((a, b, c) => console.log("test-hook-after", a, b, c))(1, 2, 3);

// test_all();


module.exports = {
    Group, G,
    Chain, C,
    Map, M,
    Chord, H,
    AnyOne, A,
    FunctionSure, F,
    ExtractFunction, E
}