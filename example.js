/**
 * @file step.js, all data from server function here
 * @author aosyang<luckyfire@qq.com>
 */
const {G, Group, Chain, C, Map, M, Chord, H, AnyOne, A} = require("./step-flow");

const vs = (...v) => {
    console.log(...v);
    return v;
};

// chain
C(1, () => 2, '${arg + 1}', ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 31
C(1, () => 2, '${arg + 1}', arg => Number(arg), ((arg, num) => arg + num).s(1), arg => arg)().then(vs); // output: 4

// Group
G(1, () => 2, 3, () => () => () => 4)().then(vs); // output: [1, 2, 3, 4]

// Map
M(G(1,2, C(3, 4, 5), 6, C(7, arg => arg * 10), () => 8), v => v * 10)().then(vs); // output: [10, 20, 50, 60, 700, 80]

// Chord
H(arr => arr, 1, 2, 3, 4, 5, 6, 7)().then(vs); // output: [1,2,3,4,5,6,7]

// AnyOne
A((v, i) => vs(v, i), 1, 2, 3, 4 ,5)().then(vs); // output: [undefined, undefined, undefined, undefined, undefined]


function test_hook(a, b, c) {
    console.log("test-hook", a, b, c);
    return a + b +c;
}

// hook
test_hook.bf((a, b, c) => console.log("test-hook-before", a, b, c)).af((a, b, c) => console.log("test-hook-after", a, b, c))(1, 2, 3);

