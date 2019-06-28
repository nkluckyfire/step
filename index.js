/**
 * @file step.js, all data from server function here
 * @author aosyang<luckyfire@qq.com>
 */
const se = require("./step-engine");
const sf = require("./step-flow");
module.exports = {
    se,
    sf
}

Function.prototype.before = function(cb) {
    this._bf = cb;
    return (...args) => {
        this._bf && this._bf(...args);
        let ret = this(...args);
        this._af && this._af(ret);
        return ret;
    }
}

Function.prototype.after = function(cb) {
    this._af = cb;
    return (...args) => {
        this._bf && this._bf(...args);
        let ret = this(...args);
        this._af && this._af(ret);
        return ret;
    }
}

function test(a, b, c) {
    console.log("mid", a, b, c);
    let r = a + b + c;
    return r;
}

console.log(Date.now.before().after(v => console.log(v))());

test.before((a, b, c) => console.log('before', a, b ,c)).after(d => console.log('after', d))(1, 2, 3);
test.before((a, b, c) => console.log('before', a, b ,c)).after(d => console.log('after', d))(10, 20, 30);