'use strict';

const Cartesian2 = require('../ThirdParty/Cesium/Source/Core/Cartesian2');
const Cartesian3 = require('../ThirdParty/Cesium/Source/Core/Cartesian3');
const Color = require('../ThirdParty/Cesium/Source/Core/Color');
const HorizontalOrigin = require('../ThirdParty/Cesium/Source/Scene/HorizontalOrigin');
const NearFarScalar = require('../ThirdParty/Cesium/Source/Core/NearFarScalar');
const PolylineGlowMaterialProperty = require('../ThirdParty/Cesium/Source/DataSources/PolylineGlowMaterialProperty');
const Viewer = require('../ThirdParty/Cesium/Source/Widgets/Viewer/Viewer');

class Globe {
    /**
     * Construct a Cesium viewer instance in the provided container element
     * @param  {HTMLElement} div The container in which to to create the Cesium instance
     */
    constructor(container) {
        let credits = document.createElement('div');
        credits.style.display = 'none';
        container.appendChild(credits);
        this._viewer = new Viewer(container, {
            animation: false,
            fullscreenButton: false,
            homeButton: false,
            geocoder: false,
            timeline: false,
            navigationHelpButton: false,
            creditContainer: credits
        });
        this._pathSegments = [];
        this._locations = [];
    }

    get viewer() {
        return this._viewer;
    }

    /**
     * Places locations on the map
     * @param  {Array<Object>} locations The location objects, including name, lon, lat
     * @param  {Object} [textFader] Object describing how to fade placename text
     */
    displayLocations(locations, textFader) {
        let translucencyScalar = null;
        if (typeof textFader !== 'undefined') {
            translucencyScalar = new NearFarScalar(textFader.near, 1, textFader.far, 0);
        }
        this._locations.forEach(x => this._viewer.entities.remove(x));
        for (let i = 0; i < locations.length; ++i) {
            let loc = locations[i];
            this._locations.push(this._viewer.entities.add({
                position: Cartesian3.fromDegrees(loc.lon, loc.lat),
                name: loc.name,
                billboard: { image: 'resources/blueball_sm.png', width: 24, height: 24 }
            }));
            let label = {
                text: loc.name,
                pixelOffset: new Cartesian2(24, 0),
                horizontalOrigin: HorizontalOrigin.LEFT,
            }
            if (translucencyScalar !== null) {
                label.translucencyByDistance = translucencyScalar;
            }
            this._viewer.entities.add({
                position: Cartesian3.fromDegrees(loc.lon, loc.lat),
                name: loc.name,
                label: label
            });
        }
    }

    clearPaths() {
        this._pathSegments.forEach(x => this._viewer.entities.remove(x));
    }

    displayPath(positions, color) {
        let seg = this._viewer.entities.add({ polyline: {
            positions: Cartesian3.fromDegreesArray(positions),
            width: 5,
            material: new PolylineGlowMaterialProperty({
                glowPower: 0.3,
                color: color
            })
        }});
        this._pathSegments.push(seg);
    }
};

module.exports = Globe;
