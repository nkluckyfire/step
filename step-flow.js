/**
 * @file step.js, all data from server function here
 * @author aosyang<luckyfire@qq.com>
 */

Function.prototype.s = function(...args) {
    return arg => {
        args = arg === undefined ? args : [arg].concat(args);
        return this(...args);
    }
}

Function.prototype.p = function(...args) {
    return Promise.resolve(this(...args));
}

const P = any => Promise.resolve(any);

const E = v => {
    while(typeof v === 'function') {
        v = v();
    }
    return v;
}

const Group = (...fs) => {
    return () => Promise.all(fs.map(v => P(E(v))));
};

const G = Group;

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

const Chain = (...fs) => () => _Chain(fs, 0, null);
const C = Chain;

const Map = (gs, cb) => {
    return () => gs().then(r => r.map(cb));
}

const M = Map;

M(G(1,2, C(3, 4, 5), 6, C(7, arg => arg * 10), () => 8), v => v * 1234)().then(r => console.log(r));

module.exports = {
    Group,
    G,
    Chain,
    C,
    Map,
    M
}