const geolocation = {
    // Calculate safe zone boundaries
    calculateSafeZone: (centerLat, centerLng, radiusKm) => {
        const earthRadius = 6371; // km
        const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
        const lngDelta = (radiusKm / earthRadius) * (180 / Math.PI) / Math.cos(centerLat * Math.PI / 180);
        
        return {
            north: centerLat + latDelta,
            south: centerLat - latDelta,
            east: centerLng + lngDelta,
            west: centerLng - lngDelta,
            center: { lat: centerLat, lng: centerLng },
            radius: radiusKm
        };
    },

    // Check if point is within safe zone
    isInSafeZone: (pointLat, pointLng, safeZone) => {
        return pointLat >= safeZone.south && 
               pointLat <= safeZone.north && 
               pointLng >= safeZone.west && 
               pointLng <= safeZone.east;
    },

    // Calculate bearing between two points
    calculateBearing: (lat1, lng1, lat2, lng2) => {
        const startLat = lat1 * Math.PI / 180;
        const startLng = lng1 * Math.PI / 180;
        const endLat = lat2 * Math.PI / 180;
        const endLng = lng2 * Math.PI / 180;

        const y = Math.sin(endLng - startLng) * Math.cos(endLat);
        const x = Math.cos(startLat) * Math.sin(endLat) -
                 Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);
        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    },

    // Generate points for safe zone polygon
    generateZonePolygon: (centerLat, centerLng, radiusKm, sides = 12) => {
        const points = [];
        const earthRadius = 6371;
        
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI) / sides;
            const lat = centerLat + (radiusKm / earthRadius) * (180 / Math.PI) * Math.cos(angle);
            const lng = centerLng + (radiusKm / earthRadius) * (180 / Math.PI) * Math.sin(angle) / Math.cos(centerLat * Math.PI / 180);
            points.push({ lat, lng });
        }
        
        return points;
    },

    // Find nearest safe zone from current position
    findNearestSafeZone: (currentLat, currentLng, safeZones) => {
        let nearestZone = null;
        let minDistance = Infinity;

        safeZones.forEach(zone => {
            const distance = this.calculateDistance(currentLat, currentLng, zone.center.lat, zone.center.lng);
            if (distance < minDistance) {
                minDistance = distance;
                nearestZone = zone;
            }
        });

        return {
            zone: nearestZone,
            distance: minDistance,
            bearing: this.calculateBearing(currentLat, currentLng, nearestZone.center.lat, nearestZone.center.lng)
        };
    }
};

// Add calculateDistance method to geolocation object
geolocation.calculateDistance = require('./helpers').calculateDistance;

module.exports = geolocation;
