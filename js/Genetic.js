'use strict';

const CostCalculator = require('./CostCalculator');
const Individual = require('./Individual');
const random = require('./random');

class Genetic {
    /**
     * Create a genetic algorithm TSP optimizer
     * @param  {JSON} nodes                  The JSON description of the nodes (see nodes.json)
     * @param  {String} startNode            The ID of the start/end node
     * @param  {Number} populationSize       The number of individuals to maintain in the population
     * @param  {Number} attemptsPerIteration The number of mutations to try per individual
     * @param  {Number} minLifetime          The minimum number of generations for an individual to live
     */
    constructor(nodes, startNode, populationSize, attemptsPerIteration, minLifetime) {
        this._attemptsPerIteration = attemptsPerIteration;
        this._minLifetime = minLifetime;
        this._calculator = new CostCalculator(nodes);

        // Create first individual from path, from start node back to start node
        let path = Array.prototype.concat(startNode,
            nodes.map(x => x.id).filter(x => x !== startNode),
            startNode);
        this._eve = new Individual(path, this._calculator);
        this._pop = [];

        // Create initial population
        for (let i = 0; i < populationSize; ++i) {
            let indiv = this._eve.spawnShuffle();
            this._pop.push(indiv);
        }
    }

    runGeneration() {
        this._cullPopulation();
        this._mutatePopulation();
        this._sortPopulation();
    }

    _cullPopulation() {
        let markedForDeath = Array(this._pop.length).fill(false);

        // Preserve diversity - only keep one of each type
        let genotypes = new Set();
        let worstCost = null;
        for (let i = 0; i < this._pop.length; ++i) {
            let indiv = this._pop[i];
            if (genotypes.has(indiv.genotype)) {
                markedForDeath[i] = true;
                //console.log(`* Culled ${i} - diversity`);
            }
            else {
                genotypes.add(indiv.genotype);
            }
        }

        // This approach assumes that cull is called before mutate,
        // and that the individuals are therefore in sorted order
        for (let i = this._pop.length - 1; i > 1; --i) {
            let indiv = this._pop[i];
            if (indiv.longevity > this._minLifetime && indiv.cost > this._pop[0].cost) {
                markedForDeath[i] = true;
                //console.log(`* Culled ${i} - worst cost`);
            }
        }

        // Replace marked individuals with newly shuffled ones
        for (let i = 0; i < this._pop.length; ++i) {
            if (markedForDeath[i]) {
                this._pop[i] = this._eve.spawnShuffle();
            }
        }
    }

    _mutatePopulation() {
        const mutationDistribution = random.makeRandomInts(1, 100);
        var indiv, bestChild, child;
        // Mutate / cross generation
        for (let i = 0; i < this._pop.length; ++i) {
            indiv = this._pop[i];
            bestChild = indiv;
            for (let j = 0; j < this._attemptsPerIteration; ++j) {
                // Mutate or cross per probabilities in if-chain
                let r = mutationDistribution(this._mt);
                if (r <= 30) {
                    child = indiv.spawnTransposeLocal();
                }
                else if (r <= 60){
                    child = indiv.spawnShiftSegment();
                }
                else if (r <= 90) {
                    child = indiv.spawnReverseSegment();
                }
                else {
                    let o = random.makeRandomInts(0, this._pop.length - 2)();
                    if (o >= i) {
                        o += 1;
                    }
                    child = indiv.crossFromOther(this._pop[o]);
                }
                if (child.cost < bestChild.cost) {
                    bestChild = child;
                }
            }
            if (bestChild.cost < indiv.cost) {
                this._pop[i] = bestChild;
            }
            else {
                indiv.increaseLongevity();
            }
        }
    }

    _sortPopulation() {
        const cmp = function(a, b) {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
        this._pop.sort((a, b) => {
            return cmp(a.cost, b.cost) || cmp(b.longevity, a.longevity) || cmp(b.genotype, a.genotype);
        });
    }

    printPopulation() {
        for (let i = 0; i < this._pop.length; ++i) {
            console.log(`${i}) ${this._pop[i].toString()}`);
        }
    }

    get population() {
        return this._pop;
    }
}

module.exports = Genetic;
