'use strict';

const Cartesian3 = require('../ThirdParty/Cesium/Source/Core/Cartesian3');
const Color = require('../ThirdParty/Cesium/Source/Core/Color');
const Viewer = require('../ThirdParty/Cesium/Source/Widgets/Viewer/Viewer');
const buildModuleUrl = require('../ThirdParty/Cesium/Source/Core/buildModuleUrl');
const Globe = require('./Globe');
const Genetic = require('./Genetic');
const graphs = require('./graphs');

var config = null;
var nodeMap = new Map();
var state = 'initial';  // 'initial', 'running', 'stopped', 'done'
var timeUsed = 0;
var generation = 0;
var generationLimit = 0;
var generationData = [];
var optimizer = null;
var globe = null;

/**
 * Application main
 */
const main = function() {
    buildModuleUrl.setBaseUrl('/Cesium');
    var container = document.getElementById('globe');
    globe = new Globe(container);
    sliderBindings();
    buttonBindings();
    loadScenario(document.getElementById('scenario').value);
};

function loadScenario(scenario) {
    let req = new XMLHttpRequest();
    req.addEventListener('load', res => {
        // Parse config file
        config = JSON.parse(res.target.responseText)

        // Build node lookup
        var nodes = config.nodes;
        for (let i = 0; i < nodes.length; ++i) {
            nodeMap.set(nodes[i].id, nodes[i]);
        }

        // Display nodes & set camera view
        globe.displayLocations(nodes, config.globe.textFader);
        let view = config.globe.startView;
        globe.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(view.lon, view.lat, view.alt)
        })

        updateParameters();
        reset();
    });
    req.open('GET', '/resources/' + scenario);
    req.send();
}

function updateParameters() {
    let parms = config.params;
    if (typeof parms.populationSize !== 'undefined') {
        document.getElementById('populationSize').value = parms.populationSize;
    }
    if (typeof parms.numMutations !== 'undefined') {
        document.getElementById('numMutations').value = parms.numMutations;
    }
    if (typeof parms.minLifetime !== 'undefined') {
        document.getElementById('minLifetime').value = parms.minLifetime;
    }
    if (typeof parms.genLimit !== 'undefined') {
        document.getElementById('genLimit').value = parms.genLimit;
    }
}

function sliderBindings() {
    let left = document.getElementById('globe'),
        right = document.getElementById('sidebar'),
        slider = document.getElementById('slider');

    let resizeDragging = false;
    slider.addEventListener('mousedown', event => {
            event.preventDefault();
            resizeDragging = true;
    });
    document.addEventListener('mouseup', event => {
        resizeDragging = false;
    });
    document.addEventListener('mousemove', event => {
        if (resizeDragging) {
            let newWidth = slider.parentNode.offsetWidth - event.pageX;
            right.style.flexBasis = newWidth + 'px';
        }
    });
}

var playButton = document.getElementById('playButton'),
    pauseButton = document.getElementById('pauseButton'),
    stepButton = document.getElementById('stepButton'),
    resetButton = document.getElementById('resetButton');

function buttonBindings() {
    setButtonState();
    playButton.addEventListener('click', run);
    pauseButton.addEventListener('click', pause);
    stepButton.addEventListener('click', step);
    resetButton.addEventListener('click', reset);
    document.getElementById('scenario').addEventListener('change', event => {
        loadScenario(event.target.value);
    });
}

function setButtonState() {
    if (state === 'initial' || state === 'stopped') {
        playButton.disabled = false;
    }
    else {
        playButton.disabled = true;
    }
    if (state === 'running') {
        pauseButton.disabled = false;
    }
    else {
        pauseButton.disabled = true;
    }
    if (state === 'initial' || state === 'stopped' || state === 'done') {
        stepButton.disabled = false;
        resetButton.disabled = false;
    }
    else {
        stepButton.disabled = true;
        resetButton.disabled = true;
    }
}

function createOptimizer() {
    let populationSize = document.getElementById('populationSize').value,
        numMutations = document.getElementById('numMutations').value,
        minLifetime = document.getElementById('minLifetime').value,
        genLimit = document.getElementById('genLimit').value;
    generationLimit = genLimit;
    return new Genetic(config.nodes, config.startNode,
        populationSize, numMutations, minLifetime);
}

var pauseSignaled = false;
function run() {
    state = 'running';
    setButtonState();
    console.log('Running optimization');

    let running = true;
    let run = function() {
        runOneGeneration();
        if (optimizer.population[0].longevity >= config.params.genLimit) {
            running = false;
            state = 'done';
            console.log('We\'re done!');
        }
        else if (pauseSignaled) {
            running = false;
            state = 'stopped';
            pauseSignaled = false;
        }
        if (running) {
            window.setTimeout(run, 100);
        }
        else {
            setButtonState();
        }
    }
    run();
}

function step() {
    console.log('Stepping optimization');
    if (state !== 'done') {
        state = 'stopped';
    }
    runOneGeneration();
    setButtonState();
}

function pause() {
    console.log('Pausing optimization');
    pauseSignaled = true;
}

function reset() {
    optimizer = createOptimizer();
    timeUsed = 0;
    generation = 0;
    generationData = [];
    state = 'initial';
    setButtonState();
    displayCurrentResults();
    console.log('Optimization reset');
}

function runOneGeneration() {
    // FUTURE - web worker?
    let t0 = performance.now();
    optimizer.runGeneration();
    let t1 = performance.now();
    generation += 1;
    timeUsed += t1 - t0;
    console.log('timeUsed: ' + timeUsed);
    generationData.push(optimizer.population[0].cost);
    displayCurrentResults();
}

function displayCurrentResults() {
    let highScore = document.getElementById('highScore'),
        gen = document.getElementById('generation'),
        longevity = document.getElementById('longevity'),
        timePerGen = document.getElementById('timePerGen'),
        totalTime = document.getElementById('totalTime');

    if (state === 'initial') {
        highScore.innerHTML = '';
        gen.innerHTML = '';
        longevity.innerHTML = '';
        timePerGen.innerHTML = '';
        totalTime.innerHTML = '';
        displayGraphs(false);
        globe.clearPaths();
    }
    else {
        let best = optimizer.population[0];
        highScore.innerHTML = best.cost.toFixed(2);
        gen.innerHTML = generation;
        longevity.innerHTML = best.longevity;
        timePerGen.innerHTML = (timeUsed / generation).toFixed(0);
        totalTime.innerHTML = (timeUsed / 1000).toFixed(1);
        displayGraphs(true);
        displayPaths();
    }
}


function displayPaths() {
    // Show best score path
    let path = optimizer.population[0].path;
    let positions = [];
    for (let i = 0; i < path.length; ++i) {
        let node = nodeMap.get(path[i]);
        positions.push(node.lon);
        positions.push(node.lat);
    }
    globe.clearPaths();
    globe.displayPath(positions, new Color(0, 1, 0, 1));  // R, G, B, A
    // FUTURE: would be cool to "age" old paths with alpha
}

function displayGraphs(show) {
    if (show) {
        graphs.scatterLineGraph(document.getElementById('bestScoreGraph'), {
            series: generationData.map((d, i) => ({x: i + 1, y: d})),
            minXMax: 50
        });
        graphs.barGraph(document.getElementById('populationScoreGraph'), {
            series: optimizer.population.map((d, i) => ({x: i + 1, y: d.cost}))
        });
        graphs.barGraph(document.getElementById('populationLongevityGraph'), {
            series: optimizer.population.map((d, i) => ({x: i + 1, y: d.longevity}))
        });
    }
    else {
        graphs.clearGraph(document.getElementById('bestScoreGraph'));
        graphs.clearGraph(document.getElementById('populationScoreGraph'));
        graphs.clearGraph(document.getElementById('populationLongevityGraph'));
    }
}

// Load main function properly once document is ready
(function() {
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        main();
    } else {
        document.addEventListener('DOMContentLoaded', () => main());
    }
}());
