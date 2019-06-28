# step-engine,step-flow

## step-flow 流程控制编排引擎

基于promise的编排引擎，主要用于控制编组、串联、映射操作

### 举例说明

```javascript
function test_all() {
    C(1, () => 2, '${arg + 1}', ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 31
    C(1, () => 2, '${arg + 1}', arg => Number(arg), ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 4
    G(1, () => 2, 3, () => () => () => 4)().then(vs); // output: [1, 2, 3, 4]
    H(arr => arr, 1, 2, 3, 4, 5, 6, 7)().then(vs); // output: [1,2,3,4,5,6,7]
    M(G(1,2, C(3, 4, 5), 6, C(7, arg => arg * 10), () => 8), v => v * 10)().then(vs); // output: [10, 20, 50, 60, 700, 80]
    AnyOne((v, i) => console.log(v, i), 1, 2, 3, 4 ,5)().then(vs); // output: [undefined, undefined, undefined, undefined, undefined]
}

test_all();
```

### 高级用法

1. 任何编排函数的输入不限制类型，即不要求必须是promise
2. 内部对Function做了扩展，支持.s操作用于生成函数签名。

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

3. Function扩展hook，支持af前置hook和bf后置hook

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

#### Group,G编组操作

对输入进行group操作，类似promise的all

#### Chain,C串联操作

参数形式支持：

1. 基本类型，对象，数组，例如：number， bool，此时会直接使用参数值作为返回值，作为下一个参数的输入值
2. 函数，函数签名
3. 模板字符串，只能用单引号包围的字符串，书写方式尾反引号字符串格式。```'${arg}'```, 其中arg是固定的对前一个返回值的引用

前一个的返回值是后面的第一个参数，支持特殊参数

#### Map,M映射操作

类似数组的map操作，该map只能针对Group的结果进行map，目的是对Group的每一项进行独立操作

#### Chord,H组合操作,即先group，然后chain

```javascript
// 输出[1,2,3,4,'5']
Chord(arr => console.log(arr), 1, 2, 3, ()=>4, '5')();
```

#### 混合编排

G,C,M,H可以任意组合，参考例子

## step-engine 流程控制步骤引擎

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

# 使用说明

## 使用

```javascript
se('instance-name').step('step-name', () => {
    ///
    /// step 执行函数
    /// 
}).catch(e => {
    ///
    /// 异常处理函数
    ///
});
```
## 举例
```javascript
se('name').step('t1', () => {
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
#### 循环（loop）
loop(step)指定从哪一个步骤开始循环
```javascript
se('looptest').step('s1', () => 0).step('s2', () => 0).loop('s1')
```
运行之后，会循环执行s1，s2
#### 延时（sleep）
sleep(ms),指定延时的时间ms，然后执行下一步
```javascript
se('sleepTest').sleep(1000).step('s1', () => 0);
```
运行之后，1000ms之后执行s1
