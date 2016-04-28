'use strict';

const Genetic = require('./Genetic');
const random = require('./random');

class Individual {
    constructor(path, calculator) {
        this._path = path.slice(0);
        this._calculator = calculator;
        this._genotype = this._path.join('');
        this._cost = computeCost(this._path, calculator);
        this._longevity = 0;
    }

    spawnShuffle() {
        let start = [this._path[0]];
        let middle = this._path.slice(1, this._path.length - 1);
        shuffle(middle);
        let path = start.concat(middle, start);
        return new Individual(path, this._calculator);
    }

    /**
     * Transposes two adjacent segments
     */
    spawnTransposeLocal() {
        let start = [this._path[0]];
        let middle = this._path.slice(1, this._path.length - 1);
        // Size of segments can be up to half of the total length
        let size = random.makeRandomInts(1, Math.floor(middle.length / 2))();
        let first = random.makeRandomInts(0, middle.length - (2 * size))();
        //console.log(`SwapLocal: size - ${size}, first - ${first}, ${middle.join('')}`);
        swapSegments(middle, first, first + size, size);
        //console.log(`  ...becomes ${middle.join('')}`);
        return new Individual(start.concat(middle, start), this._calculator);
    }

    /**
     * Shifts a segment to another random place in the sequence
     */
    spawnShiftSegment() {
        let start = [this._path[0]];
        let middle = this._path.slice(1, this._path.length - 1);
        // Size of segment can be up to half of the total length
        let size = random.makeRandomInts(1, Math.floor(middle.length / 2))();
        let first = random.makeRandomInts(0, middle.length - size)();
        //console.log(`ShiftSeg: size - ${size}, first - ${first}, ${middle.join('')}`);
        let segment = middle.splice(first, size);
        let insertionPt = random.makeRandomInts(0, middle.length - 1)();
        middle = middle.slice(0, insertionPt).concat(segment, middle.slice(insertionPt));
        //console.log(`  ...inserted at position ${insertionPt} becomes ${middle.join('')}`);
        return new Individual(start.concat(middle, start), this._calculator);
    }

    spawnReverseSegment() {
        let start = [this._path[0]];
        let middle = this._path.slice(1, this._path.length - 1);
        // Reverse segment of size up to N - 1
        let rSize = random.makeRandomInts(2, middle.length - 1)();
        let rStart = random.makeRandomInts(0, middle.length - rSize)();
        let rSeg = middle.slice(rStart, rStart + rSize);
        rSeg.reverse();
        return new Individual(
            Array.prototype.concat(start,
                                   middle.slice(0, rStart),
                                   rSeg,
                                   middle.slice(rStart + rSize - 1),
                                   start),
            this._calculator);
    }

    crossFromOther(other) {
        let start = [this._path[0]];
        let middle = this._path.slice(1, this._path.length - 1);
        // Take no more than half
        let oSize = random.makeRandomInts(2, Math.floor(middle.length / 2))();
        let oStart = random.makeRandomInts(1, middle.length - oSize + 1)();
        let oSeg = other.path.slice(oStart, oStart + oSize);
        let mMinusO = setDifference(middle, oSeg);
        return new Individual(
            Array.prototype.concat(start,
                                   mMinusO.slice(0, oStart),
                                   oSeg,
                                   mMinusO.slice(oStart),
                                   start),
            this._calculator);
    }

    get path() {
        return this._path;
    }

    /**
     * @return {String} Representation of the genotype, to compare if two Individuals are the same
     */
    get genotype() {
        return this._genotype;
    }

    get cost() {
        return this._cost;
    }

    get longevity() {
        return this._longevity;
    }
    increaseLongevity() {
        this._longevity += 1;
    }

    toString() {
        return `[path: ${this._path.join('')}, cost: ${this._cost}, longevity: ${this._longevity}]`;
    }
}

/**
 * Swap in place in an array, the item at i with the item at j
 */
function swap(a, i, j) {
    let temp = a[i];
    a[i] = a[j];
    a[j] = temp;
}

/**
 * Returns an array consisting of elements in a, not in b
 */
function setDifference(a, b) {
    let set = new Set();
    let result = [];
    for (let i = 0; i < b.length; ++i) {
        set.add(b[i]);
    }
    for (let i = 0; i < a.length; ++i) {
        if (!set.has(a[i])) {
            result.push(a[i]);
        }
    }
    return result;
}

/**
 * Swap in place in an array, the segment starting at i1, with the segment starting at i2,
 * both segments being of size length
 */
function swapSegments(a, i1, i2, size) {
    let s2 = a.slice(i2, i2 + size);
    let s1 = Array.prototype.splice.apply(a, [i1, size].concat(s2));
    Array.prototype.splice.apply(a, [i2, size].concat(s1));
}

function computeCost(path, calculator) {
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; ++i) {
        let origin = path[i];
        let destination = path[i+1];
        totalCost += calculator.computeCost(origin, destination);
    }
    return totalCost;
}

function shuffle(a) {
    var r, temp;
    for (let i = 0, len = a.length - 1; i <= len; ++i) {
        r = random.makeRandomInts(i, len)();
        temp = a[i];
        a[i] = a[r];
        a[r] = temp;
    }
}

module.exports = Individual;
