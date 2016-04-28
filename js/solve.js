'use strict';

const now = require('performance-now');
const Genetic = require('./Genetic');
const nodes = require('./nodes.json');

console.log('Running genetic TSP solver');
let optimizer = new Genetic(nodes, 'K', 10, 1000, 10);
optimizer.printPopulation();
var t0, t1;
for (let i = 1; i <= 100; ++i) {
    //t0 = performance.now();
    t0 = now();
    optimizer.runGeneration();
    //t1 = performance.now();
    t1 = now();
    console.log(`Generation ${i} output (took ${t1 - t0} ms):`);
    optimizer.printPopulation();
}
