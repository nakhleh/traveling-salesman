'use strict';

const deg2Rad = Math.PI / 180;
//const earthRadius = 6371000;   // Radius of Earth in metres
const earthRadius = 3959;   // Radius of Earth in miles

/**
 * Computes the costs between different locations. It caches the costs for efficiency.
 * Currently, it:
 *    - only supports great circle distance
 *    - assumes all costs are bidirectional
 */
class CostCalculator {
    /**
     * Constructor
     * @param {Object} nodes The description of the nodes
     * @param {Object} options Options for the cost CostCalculator
     * @param {Number} options.speed If specified, compute cost in time, else, distance (miles)
     */
    constructor(nodes, options) {
        this._nodes = nodes;
        if (typeof options === 'undefined') {
            options = {};
        }
        if ("speed" in options) {
            this._speed = options.speed;
        }
        else {
            this._speed = 0;
        }
        this._nodes = new Map();
        for (let i = 0; i < nodes.length; ++i) {
            this._nodes.set(nodes[i].id, nodes[i]);
        }
        this._costs = new Map();
    }

    computeCost(a, b) {
        a = this._nodes.get(a);
        b = this._nodes.get(b);
        if (a.id === b.id) {
            return 0;
        }
        else if (a.id > b.id) {
            let temp = b;
            b = a;
            a = temp;
        }
        let key = `${a.id}->${b.id}`;
        let value;
        if (this._costs.has(key)) {
            value = this._costs.get(key);
        }
        else {
            value = haversineDistance(a.lat, a.lon, b.lat, b.lon);
            if (this._speed > 0) {
                value = value / this._speed;
            }
            this._costs.set(key, value);
        }
        return value;
    }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    lat1 = lat1 * deg2Rad;
    lat2 = lat2 * deg2Rad;
    let deltaLat = lat2 - lat1;
    let deltaLon = (lon2 - lon1) * deg2Rad;
    let a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return c * earthRadius;
}

module.exports = CostCalculator;
