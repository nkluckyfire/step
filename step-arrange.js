/**
 * @file step-flow.js, 基于promise的调用编排框架
 * @author aosyang<luckyfire@qq.com>
 */
const {FunctionSure, F, ExtractFunction, E, PromiseSure, P} = require('./func-extends');

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

module.exports = {
    Group, G, // group：编组操作
    Chain, C, // chain：串联操作
    Map, M, //   Map： 映射操作
    Chord, H, AnyOne, A
}