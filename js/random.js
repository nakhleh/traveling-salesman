'use strict';

const Rand = require('random-js');

/**
 * Use Mersenne Twister for deterministic pseudo-randomness
 */
const engine = Rand.engines.mt19937();
engine.seed(4);    // RFC 1149.5
//engine.autoSeed();

module.exports = {
    /**
     * Set a new seed
     * @param {Number} seed Must be a 32 bit signed int
     */
    setSeed(seed) {
        engine.seed(seed);
    },

    /**
     * Creates a function that returns random ints in the range [min, max]
     */
    makeRandomInts(min, max) {
        let distribution = Rand.integer(min, max);
        return function() {
            return distribution(engine);
        }
    },

    /**
     * Creates a function that returns random reals in the range [min, max)
     */
    makeRandomReals(min, max) {
        let distribution = Rand.real(min, max, false);
        return function() {
            return distribution(engine);
        }
    }
}
