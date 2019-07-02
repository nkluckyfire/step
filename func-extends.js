/**
 * @file func-extends.js 函数扩展
 * @author aosyang<luckyfire@qq.com>
 */

/**
 * 强制将输入转换为可以调用的函数
 * @param {*} v 输入，可以是函数，也可以是任意类型的值
 */
const FunctionSure = v => (typeof v === "function" ? v : () => v);
const F = FunctionSure;

/**
 * 将输入转换为一个promise
 * @param {*} any 任意输入，可以是对象或者po甚至函数 
 */
const PromiseSure = any => any instanceof Promise ? any : Promise.resolve(any);
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
 * 对函数生成签名副本，调用方法等同于原函数
 * 1. 如果调用时，传入额外参数，会将该参数作为原函数的第一个参数
 * 2. 如果调用时，没有传入额外参数，则等同于原函数
 * e.g
 * function test(a, b, c) {}
 * test.s(1, 2, 3)()
 * test.s(2, 3)(1)
 * 的效果是一致的
 */
Function.prototype.s = function(...args) {
  return arg => {
    args = arg === undefined ? args : [arg].concat(args);
    return this(...args);
  };
};

Function.prototype._hcall = function(...args) {
  this.__bf__ && this.__bf__.map(f => f(...args));
  let ret = this(...args);
  this.__af__ && this.__af__.map(f => f(ret));
  return ret;
};

/**
 * 函数前置hook
 * @param {function} cb, cb的参数输入与Function的原型保持一致
 */
Function.prototype.bf = function(cb) {
  this.__bf__ = this.__bf__ || [];
  this.__bf__.push(F(cb));
  return this._hcall.bind(this);
};

/**
 * 函数后置hook
 * @param {function} cb, 回掉hook函数，参数为原函数的返回值
 */
Function.prototype.af = function(cb = ret => undefined) {
  this.__af__ = this.__af__ || [];
  this.__af__.push(F(cb));
  return this._hcall.bind(this);
};

module.exports = {
  FunctionSure, F, ExtractFunction, E, PromiseSure, P
};
