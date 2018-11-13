'use strict';

const d3 = require('d3');

module.exports = {

    clearGraph(container) {
        d3.select(container).selectAll('*').remove();
    },

    /**
     * Plots a bar graph from data
     * @param  {HtmlElement} container A container element to hold the graph
     * @param  {Object} data  format: { series: [ {x: <cat1>, y: <val1>}, ... ], xLabel: <String>, yLabel: <String> }
     */
    barGraph(container, data) {
        let margins = getMargins(container);
        d3.select(container).selectAll('*').remove();
        //console.log(JSON.stringify(data));

        let x = d3.scaleBand()
                        .domain(data.series.map(d => d.x))
                        .rangeRound([0, margins.width], .1);
        let y = d3.scaleLinear()
                        .domain([0, d3.max(data.series, d => d.y)])
                        .range([margins.height, 0]);
        let xAxis = d3.axisBottom(x).tickSize(0);
        let yAxis = d3.axisLeft(y).tickSize(0);
        let svg = addSvgElements(container, margins, xAxis, yAxis);

        svg.selectAll(".bar").data(data.series)
                             .enter().append("rect")
                                     .attr("class", "bar")
                                     .attr("x", d => x(d.x))
                                     .attr("width", x.bandwidth())
                                     .attr("y", d => y(d.y))
                                     .attr("height", d => margins.height - y(d.y));
    },

    scatterLineGraph(container, data) {
        let margins = getMargins(container);
        d3.select(container).selectAll('*').remove();
        //console.log(JSON.stringify(data));

        let xMax = d3.max(data.series, d => d.x);
        if (typeof data.minXMax !== 'undefined' && data.minXMax > xMax) {
            xMax = data.minXMax;
        }
        let x = d3.scaleLinear()
                        .domain([0, xMax])
                        .range([0, margins.width]);
        let y = d3.scaleLinear()
                        .domain([0, d3.max(data.series, d => d.y)])
                        .range([margins.height, 0]);
        let xAxis = d3.axisBottom(x).tickSize(0);
        let yAxis = d3.axisLeft(y).tickSize(0);

        let svg = addSvgElements(container, margins, xAxis, yAxis);

        let valueline = d3.line()
                          .x(d => x(d.x))
                          .y(d => y(d.y));
        svg.append('path').attr('class', 'line')
                          .attr('d', valueline(data.series));

        svg.selectAll('.dot').data(data.series)
                             .enter().append('circle')
                                     .attr('r', 2)
                                     .attr('cx', d => x(d.x))
                                     .attr('cy', d => y(d.y));
    }
};

function getMargins(container) {
    let rect = container.getBoundingClientRect();
    let top = 5, right = 5, bottom = 20, left = 40;
    return {
        top, right, bottom, left,
        width: rect.width - left - right,
        height: rect.height - top - bottom - 5 // HACK: Fix the -5 hammer
    };
}

function addSvgElements(container, margins, xAxis, yAxis) {
    let svg = d3.select(container).append('svg')
                .attr('width', margins.width + margins.left + margins.right)
                .attr('height', margins.height + margins.top + margins.bottom)
                .append('g').attr('transform', `translate(${margins.left},${margins.top})`);
    svg.append('g').attr('class', 'x axis')
                   .attr('transform', `translate(0,${margins.height})`)
                   .call(xAxis);
    svg.append('g').attr('class', 'y axis')
                   .call(yAxis);
    return svg;
}
