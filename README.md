# step-engine

## 步骤引擎
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
## 安装
```
npm install @baidu/universe-step-engine
```
## 使用
```javascript
import se from '@baidu/universe-step-engine';
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
