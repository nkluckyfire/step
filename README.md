# step-engine 步骤引擎，主要包括两个模块

1. 【编排】step-arrange, 步骤编排，对输入做编排操作，可以实现Group，Chain等
2. 【流控】step-flow，步骤流程控制，类似常规程序的while，goto，sleep操作

## 安装

```javascript
npm install step-engine

```

## 简单使用

* 引入

```javascript
const {G, Group, C, Chain, L, Flow} = require('step-arrange');
```

* 编排Group与Chain

```javascript
// group 操作
const g = G(1, () => 2, 3, 4, 5);
g().then(r => console.log(r)); // [1, 2, 3, 4, 5]
// Chain操作，类似管道，前者返回作为后者参数
const c = C(1, r => r + 1, r => r * 2);
c().then(r => console.log(r)); // 4
// Groupu与Chain混合使用
G(c, c, c)().then(r => console.log(r)); //[4, 4, 4]
```

## step-arrange 流程编排引擎

### 调用规则

```javascript
OP(...params)().then(result => result);
```

1. OP: Group、Chain、Chord，Map、AnyOne的任何一个
2. params: 可变参数，可以是一个确定的值，也可以是一个函数.
3. params: 为函数时，可以使用函数签名的方式，参考前提说明
4. 使用()进行调用，返回一个promise，pormise的内容是OP的结果

### 前提说明

1. 内部对Function做了扩展，支持.s操作用于生成函数签名。

    ```javascript
    function test(a, b, c) {
        console.log(a, b, c)
    }
    // 直接调用
    test(1, 2, 3);
    // 通过函数签名调用å
    test.s(2, 3)(1);
    // 在chain中使用，可以方便的输入更多参数
    Chain(1, test.s(2, 3))();
    // 以上三种方式得到的结果是一样的，如果不实用函数签名方式，则是另外的结果
    Chain(1, test(1,2,3))();
    // 此时，先执行了test(1,2,3)，然后chain操作是无意义的操作
    ```

2. Function扩展hook，支持af前置hook和bf后置hook

    ```javascript
    function test_hook(a, b, c) {
        console.log("test-hook", a, b, c);
        return a + b +c;
    }

    test_hook.bf((a, b, c) => console.log("test-hook-before", a, b, c)).af(r => console.log("test-hook-after", r))(1, 2, 3);
    // output:
    // test-hook-before 1 2 3
    // test-hook 1 2 3
    // test-hook-after 6
    ```

### 具体说明

#### Group,G编组操作

对输入进行group操作，类似promise的all操作，内部会对所有的结果进行汇总，生成一个数组作为promise输出

#### Chain,C串联操作

参数形式支持：

1. 基本类型，对象，数组，例如：number， bool，此时会直接使用参数值作为返回值，作为下一个参数的输入值
2. 函数，函数签名
3. 模板字符串，只能用单引号包围的字符串，书写方式尾反引号字符串格式。```'${arg}'```, 其中arg是固定的对前一个返回值的引用，前一个的返回值是后面的第一个参数，支持特殊参数

```javascript
C(1, () => 2, '${arg + 1}', arg => Number(arg), ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 4
```

#### Map,M映射操作

类似数组的map操作，该map只能针对Group的结果进行map，目的是对Group的每一项进行独立操作。类似Array的map操作，对Group的结果进行更改

```javascript
M((val, index) => val * 10, G(1,2,3))().then(r => r) // [10, 20, 30]
```

#### Chord,H组合操作,即先group，然后chain

```javascript
H(val => val.map(v => v * 10), 1, 2, 3)().then(r => r) // [10, 20, 30]
```

```javascript
// 输出[1,2,3,4,'5']
Chord(arr => console.log(arr), 1, 2, 3, ()=>4, '5')();
```

#### 混合编排

G,C,M,H可以任意组合,在实际调用()之前，都是生成的函数签名

## step-flow 流程控制

基于promise的业务处理器，用以处理：

1. 异步过程类同步化操作
2. 异步过程有先后顺序的执行
3. 异步过程有前后依赖
4. 复杂业务场景，分步骤执行

## 运行原理

1. 每个步骤需要设定一个【步骤名】，和【步骤函数】，【步骤名】标识步骤，【步骤函数】是业务定义的执行函数体
2. 【步骤函数】的返回值作为下一步的【步骤名】
3. 【步骤函数】可以是同步函数，也可以是异步函数，其中异步函数必须是promise的模式
4. 步骤引擎在执行步骤时，通过处理【步骤函数】的返回值或者promise的最终值，来决策调用下一步步骤

## 使用说明

```javascript
L('instance-name').step('step-name', () => {
    ///
    /// step 执行函数
    ///
}).catch(e => {
    ///
    /// 异常处理函数
    ///
});
```

## 举例说明

```javascript
F('name').step('t1', () => {
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
```

## 【步骤函数】返回值含义

1. undefined或者没有返回值，则进入下一步。NOTE：javascript的false值都认为是没有返回值，例如：0 false等
2. $stepname 字符串，则认为返回下一步的名字
3. [$stepname, params] 返回下一步的名字以及参数,该参数会放置到step的执行函数入参
4. promise，如果返回的是一个promise，该promise会被执行结束，并且以最终结果对应到1、2、3的某种返回值

## 异常处理

类似promise的异常处理链，基于step-engine的所有异常都会在catch中回掉处理

## 高级用法

### 循环（loop）

loop(step)指定从哪一个步骤开始循环

```javascript
L('looptest').step('s1', () => 0).step('s2', () => 0).loop('s1')
```

运行之后，会循环执行s1，s2

### 延时（sleep）

sleep(ms),指定延时的时间ms，然后执行下一步

```javascript
L('sleepTest').sleep(1000).step('s1', () => 0);
```

运行之后，1000ms之后执行s1
