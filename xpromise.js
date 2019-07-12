/**
 * @file xpromise.js 函数扩展
 * @author aosyang<luckyfire@qq.com>
 */

 const _from = Symbol();
 const _extract = Symbol();

class XPromise extends Promise {
  static [_extract](obj) {
    while(typeof obj === 'function') {
      obj = obj();
    }
    return obj;
  }

  static [_from](...objs) {
    return objs.map(obj => obj instanceof Promise ? obj : new Promise((resolve, reject) => {
      try {
        resolve(XPromise[_extract](obj));
      } catch (e) {
        reject(e);
      }
    }));
  }

  static all(...obj) {
    return super.all(XPromise[_from](...obj));
  }

  static race(...obj) {
    return super.race(XPromise[_from](...obj));
  }

  static luck(...obj) {
    return new Promise((resolve, reject) => {
      let ps = XPromise[_from](...obj);
      let sz = ps.length;
      let success = 0;
      let back = 0;
      let err = null;
      ps.forEach(v => {
        v.then(r => {
          success++;
          if(success === 1) {
            success = true;
            back++;
            resolve(v);
          }
        }).catch(e => {
          err = e;
          back++;
          if (back === sz && !success) {
            reject(err);
          }
        });
      });
    });
  }
}

module.exports = XPromise;



// XPromise.luck(() => a,() => () => () => b,3,4,5,6,7,8).then(r => console.log(r)).catch(e => console.log(e));
