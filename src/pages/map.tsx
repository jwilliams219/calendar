import React, { useEffect, useState, KeyboardEvent, useRef } from "react";
import { Feature, Geometry, GeoJsonProperties, Position } from 'geojson';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
mapboxgl.accessToken = 'pk.eyJ1IjoiY2h1bmt5bXVmZmlucyIsImEiOiJjbGgzeWU4NDIwZmVwM2hvM2ltN3Rrb2dtIn0.5wk2RwmO3S8fTmjpYijjXA';
import {Item} from './userCalendar';

export const Map = ({item}: {item: Item}) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [lng, setLng] = useState(0);
    const [lat, setLat] = useState(0);
    const [zoom, setZoom] = useState(12);
    const [newMap, setNewMap] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [showLocation, setShowLocation] = useState(false);
    const [showDirections, setShowDirections] = useState(false);
    const [showSteps, setShowSteps] = useState(false);
    const [start, setStart] = useState<[number, number]>([0, 0]);
    const [instructions, setInstructions] = useState<string[]>([""]);

    useEffect(() => {
        if (showLocation && lng !== 0 && lat !== 0) {
            if (!map.current && mapContainer.current !== null) {
                map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: [lng, lat],
                zoom: zoom,
            });
            setNewMap(true);
            } else if (map.current !== null) {
                map.current.on('move', () => {
                    if (map.current !== null) {
                        setLng(parseFloat(map.current.getCenter().lng.toFixed(4)));
                        setLat(parseFloat(map.current.getCenter().lat.toFixed(4)));
                        setZoom(parseFloat(map.current.getZoom().toFixed(2)));
                    }
                });
            }
        } else if (showDirections && start[0] !== 0 && start[1] !== 0 && mapContainer.current !== null) {
            map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: start,
            zoom: zoom,
        });
        } else if ((!showMap) && map.current !== null) {
            map.current.remove()
            map.current = null; 
        }
    }, [lng, lat, zoom, showMap, showDirections]);

    useEffect(() => {
        if (!map.current || !showMap || !newMap) return;
    
        const geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        });
    
        map.current.addControl(geocoder);
        map.current.on('load', () => {
            if (map.current !== null) {
                map.current.addLayer({
                    id: 'end',
                    type: 'circle',
                    source: {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [{type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [lng, lat]}}]
                        }
                    },
                    paint: {'circle-radius': 8, 'circle-color': '#f30'}
                });
            }
        })

        setNewMap(false);
    }, [newMap]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(function(loc) {
            setStart([loc.coords.longitude, loc.coords.latitude]);
        });
    }, []);

    async function forwardGeocode(location: string) {
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?access_token=${mapboxgl.accessToken}`)
            .then(response => response.json())
            .then(data => {
                setLng(data.features[0].center[0]);
                setLat(data.features[0].center[1]);
                
            })
            .catch(error => {
                console.log(error);
        });
    }

    async function getDirections(location: string) {
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${location}.json?access_token=${mapboxgl.accessToken}`)
            .then(response => response.json())
            .then(data => {
                const end = [data.features[0].center[0], data.features[0].center[1]];
                if (start !== null) {
                    fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`)
                    .then(response => response.json())
                    .then(data => {
                        drawDirections(data, end);
                    })
                    .catch(error => {
                        console.log(error);
                    });
                }
            })
            .catch(error => {
                console.log(error);
        });
        
    }

    function drawDirections(data: any, end: number[]) {
        if (data) {
            const route = data.routes[0].geometry.coordinates;
            const geojson: Feature<Geometry, GeoJsonProperties> = {type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route}};
            if (map.current) {
                map.current.addLayer({
                    id: 'route',
                    type: 'line',
                    source: {type: 'geojson', data: geojson},
                    layout: {'line-join': 'round', 'line-cap': 'round'},
                    paint: {'line-color': '#3887be','line-width': 5,'line-opacity': 0.75}
                });
                map.current.addLayer({
                    id: 'point',
                    type: 'circle',
                    source: {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [{type: 'Feature', properties: {}, geometry: {type: 'Point',coordinates: start}}]
                        }
                    },
                    paint: {'circle-radius': 8,'circle-color': '#3887be'}
                })
                map.current.addLayer({
                    id: 'end',
                    type: 'circle',
                    source: {
                      type: 'geojson',
                      data: {
                        type: 'FeatureCollection',
                        features: [{type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: end}}]
                      }
                    },
                    paint: {'circle-radius': 8, 'circle-color': '#f30'}
                });
            }
            const steps = data.routes[0].legs[0].steps;
            let newInstructions = [""];
            newInstructions.push(`Trip: ${Math.floor(data.routes[0].duration/60)} min`);
            for (let step of steps) {
                newInstructions.push(step.maneuver.instruction);
            }
            setInstructions(newInstructions);
        }
    }

    const handleLocationView = (location: string) => {
        setShowLocation(true);
        forwardGeocode(location);
        setShowMap(true);
    };

    const handleDirectionsView = (location: string) => {
        setShowDirections(true);
        getDirections(location);
        setShowMap(true);
    };

    const getDirectionsSteps = (location: string) => {
        setShowSteps(true);
        getDirections(location);
    }
    
    const handleLeaveMapView = () => {
        setLng(0);
        setLat(0);
        setZoom(12);
        setShowLocation(false);
        setShowDirections(false);
        setShowMap(false);
    };

    const deleteInstructions = () => {
        setInstructions([""]);
        setShowSteps(false);
    }

    return (
        <div>
            <p>{item.location}</p>
            { showMap
            ? <button onClick={() => handleLeaveMapView()}>Close Map</button>
            : <div><button onClick={() => handleLocationView(item.location)}>Show Location</button><br></br>
            <button onClick={() => handleDirectionsView(item.location)}>Map Directions</button></div>
            }
            <div ref={mapContainer} className="map-container" style={ showMap ? {height: "50vw", width: "50vw"} : {height: "0px", width: "0px"}}></div>
            {showSteps && instructions.length > 1 
            ? <div><button onClick={() => deleteInstructions()}>Remove Steps</button>
            { instructions.map((instruction) => (
                <p key={instruction}>{instruction}</p>
            ))}</div>
            : <div><button onClick={() => getDirectionsSteps(item.location)}>Driving Instructions</button></div>}
            
        </div>
    )
}
