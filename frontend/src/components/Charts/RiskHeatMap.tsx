import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ZipCodeRiskData {
  zipCode: string;
  lat: number;
  lng: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  entityCount: number;
  avgRiskScore: number;
  state: string;
  city: string;
}

interface RiskHeatMapProps {
  data?: ZipCodeRiskData[];
  height?: number;
  className?: string;
}


// Component to fit bounds when data changes
const FitBounds: React.FC<{ data: ZipCodeRiskData[] }> = ({ data }) => {
  const map = useMap();
  
  useEffect(() => {
    if (data && data.length > 0) {
      const bounds = L.latLngBounds(data.map(item => [item.lat, item.lng]));
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [data, map]);
  
  return null;
};

const RiskHeatMap: React.FC<RiskHeatMapProps> = ({ 
  data = [],
  height = 400,
  className = ''
}) => {
  const [mapData, setMapData] = useState<ZipCodeRiskData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'markers' | 'clusters'>('markers');

  useEffect(() => {
    // If no data provided, generate mock data
    if (data.length === 0) {
      generateMockZipCodeData();
    } else {
      setMapData(data);
      setLoading(false);
    }
  }, [data]);

  const generateMockZipCodeData = () => {
    // Mock zip code data with coordinates for major US cities
    const mockData: ZipCodeRiskData[] = [
      // New York Area
      { zipCode: '10001', lat: 40.7505, lng: -73.9934, riskLevel: 'high', entityCount: 145, avgRiskScore: 72, state: 'NY', city: 'New York' },
      { zipCode: '10016', lat: 40.7461, lng: -73.9776, riskLevel: 'medium', entityCount: 98, avgRiskScore: 58, state: 'NY', city: 'New York' },
      { zipCode: '10019', lat: 40.7651, lng: -73.9851, riskLevel: 'critical', entityCount: 67, avgRiskScore: 89, state: 'NY', city: 'New York' },
      { zipCode: '11201', lat: 40.6937, lng: -73.9897, riskLevel: 'medium', entityCount: 112, avgRiskScore: 64, state: 'NY', city: 'Brooklyn' },
      { zipCode: '10458', lat: 40.8625, lng: -73.8882, riskLevel: 'high', entityCount: 78, avgRiskScore: 75, state: 'NY', city: 'Bronx' },
      
      // Los Angeles Area
      { zipCode: '90210', lat: 34.0901, lng: -118.4065, riskLevel: 'low', entityCount: 234, avgRiskScore: 34, state: 'CA', city: 'Beverly Hills' },
      { zipCode: '90036', lat: 34.0739, lng: -118.3410, riskLevel: 'medium', entityCount: 156, avgRiskScore: 61, state: 'CA', city: 'Los Angeles' },
      { zipCode: '90028', lat: 34.1016, lng: -118.3267, riskLevel: 'high', entityCount: 89, avgRiskScore: 78, state: 'CA', city: 'Hollywood' },
      { zipCode: '90401', lat: 34.0195, lng: -118.4912, riskLevel: 'low', entityCount: 201, avgRiskScore: 42, state: 'CA', city: 'Santa Monica' },
      { zipCode: '91423', lat: 34.1870, lng: -118.4506, riskLevel: 'medium', entityCount: 134, avgRiskScore: 66, state: 'CA', city: 'Sherman Oaks' },
      
      // Chicago Area
      { zipCode: '60601', lat: 41.8827, lng: -87.6233, riskLevel: 'medium', entityCount: 167, avgRiskScore: 55, state: 'IL', city: 'Chicago' },
      { zipCode: '60614', lat: 41.9290, lng: -87.6439, riskLevel: 'low', entityCount: 203, avgRiskScore: 42, state: 'IL', city: 'Chicago' },
      { zipCode: '60629', lat: 41.7764, lng: -87.7031, riskLevel: 'high', entityCount: 87, avgRiskScore: 76, state: 'IL', city: 'Chicago' },
      { zipCode: '60611', lat: 41.8969, lng: -87.6246, riskLevel: 'critical', entityCount: 56, avgRiskScore: 88, state: 'IL', city: 'Chicago' },
      { zipCode: '60007', lat: 42.0084, lng: -87.8733, riskLevel: 'low', entityCount: 178, avgRiskScore: 38, state: 'IL', city: 'Elk Grove' },
      
      // Houston Area
      { zipCode: '77002', lat: 29.7589, lng: -95.3677, riskLevel: 'medium', entityCount: 134, avgRiskScore: 59, state: 'TX', city: 'Houston' },
      { zipCode: '77056', lat: 29.7596, lng: -95.4616, riskLevel: 'low', entityCount: 189, avgRiskScore: 38, state: 'TX', city: 'Houston' },
      { zipCode: '77026', lat: 29.8044, lng: -95.3478, riskLevel: 'critical', entityCount: 45, avgRiskScore: 91, state: 'TX', city: 'Houston' },
      { zipCode: '77005', lat: 29.7165, lng: -95.4178, riskLevel: 'medium', entityCount: 145, avgRiskScore: 62, state: 'TX', city: 'Houston' },
      { zipCode: '77494', lat: 29.5524, lng: -95.8025, riskLevel: 'low', entityCount: 167, avgRiskScore: 45, state: 'TX', city: 'Katy' },
      
      // Phoenix Area
      { zipCode: '85001', lat: 33.4484, lng: -112.0740, riskLevel: 'high', entityCount: 112, avgRiskScore: 74, state: 'AZ', city: 'Phoenix' },
      { zipCode: '85016', lat: 33.5079, lng: -112.0362, riskLevel: 'medium', entityCount: 178, avgRiskScore: 52, state: 'AZ', city: 'Phoenix' },
      { zipCode: '85251', lat: 33.4942, lng: -111.9261, riskLevel: 'low', entityCount: 198, avgRiskScore: 35, state: 'AZ', city: 'Scottsdale' },
      { zipCode: '85281', lat: 33.4152, lng: -111.8315, riskLevel: 'medium', entityCount: 156, avgRiskScore: 58, state: 'AZ', city: 'Tempe' },
      
      // Philadelphia Area
      { zipCode: '19102', lat: 39.9534, lng: -75.1639, riskLevel: 'medium', entityCount: 143, avgRiskScore: 56, state: 'PA', city: 'Philadelphia' },
      { zipCode: '19147', lat: 39.9295, lng: -75.1580, riskLevel: 'high', entityCount: 93, avgRiskScore: 77, state: 'PA', city: 'Philadelphia' },
      { zipCode: '19103', lat: 39.9507, lng: -75.1655, riskLevel: 'low', entityCount: 167, avgRiskScore: 41, state: 'PA', city: 'Philadelphia' },
      
      // San Antonio Area
      { zipCode: '78205', lat: 29.4241, lng: -98.4936, riskLevel: 'low', entityCount: 201, avgRiskScore: 41, state: 'TX', city: 'San Antonio' },
      { zipCode: '78216', lat: 29.5149, lng: -98.4683, riskLevel: 'medium', entityCount: 156, avgRiskScore: 63, state: 'TX', city: 'San Antonio' },
      { zipCode: '78230', lat: 29.5412, lng: -98.5570, riskLevel: 'high', entityCount: 89, avgRiskScore: 72, state: 'TX', city: 'San Antonio' },
      
      // San Diego Area
      { zipCode: '92101', lat: 32.7157, lng: -117.1611, riskLevel: 'low', entityCount: 167, avgRiskScore: 39, state: 'CA', city: 'San Diego' },
      { zipCode: '92130', lat: 32.9595, lng: -117.1951, riskLevel: 'medium', entityCount: 134, avgRiskScore: 57, state: 'CA', city: 'San Diego' },
      { zipCode: '92037', lat: 32.8328, lng: -117.2713, riskLevel: 'low', entityCount: 189, avgRiskScore: 36, state: 'CA', city: 'La Jolla' },
      
      // Dallas Area
      { zipCode: '75201', lat: 32.7767, lng: -96.7970, riskLevel: 'medium', entityCount: 145, avgRiskScore: 54, state: 'TX', city: 'Dallas' },
      { zipCode: '75230', lat: 32.8668, lng: -96.7670, riskLevel: 'high', entityCount: 89, avgRiskScore: 79, state: 'TX', city: 'Dallas' },
      { zipCode: '75019', lat: 32.9495, lng: -96.8258, riskLevel: 'critical', entityCount: 56, avgRiskScore: 85, state: 'TX', city: 'Coppell' },
      
      // San Jose Area
      { zipCode: '95110', lat: 37.3382, lng: -121.8863, riskLevel: 'low', entityCount: 234, avgRiskScore: 36, state: 'CA', city: 'San Jose' },
      { zipCode: '95128', lat: 37.3230, lng: -121.9499, riskLevel: 'medium', entityCount: 167, avgRiskScore: 58, state: 'CA', city: 'San Jose' },
      { zipCode: '94301', lat: 37.4419, lng: -122.1430, riskLevel: 'low', entityCount: 145, avgRiskScore: 32, state: 'CA', city: 'Palo Alto' },
      
      // Miami Area
      { zipCode: '33101', lat: 25.7749, lng: -80.1937, riskLevel: 'high', entityCount: 98, avgRiskScore: 73, state: 'FL', city: 'Miami' },
      { zipCode: '33139', lat: 25.7907, lng: -80.1300, riskLevel: 'medium', entityCount: 156, avgRiskScore: 65, state: 'FL', city: 'Miami Beach' },
      { zipCode: '33133', lat: 25.7074, lng: -80.2426, riskLevel: 'low', entityCount: 189, avgRiskScore: 44, state: 'FL', city: 'Coral Gables' },
      
      // Seattle Area
      { zipCode: '98101', lat: 47.6062, lng: -122.3321, riskLevel: 'medium', entityCount: 167, avgRiskScore: 56, state: 'WA', city: 'Seattle' },
      { zipCode: '98109', lat: 47.6339, lng: -122.3476, riskLevel: 'low', entityCount: 201, avgRiskScore: 38, state: 'WA', city: 'Seattle' },
      { zipCode: '98004', lat: 47.6034, lng: -122.1962, riskLevel: 'low', entityCount: 178, avgRiskScore: 41, state: 'WA', city: 'Bellevue' },
      
      // Boston Area
      { zipCode: '02108', lat: 42.3601, lng: -71.0589, riskLevel: 'medium', entityCount: 134, avgRiskScore: 61, state: 'MA', city: 'Boston' },
      { zipCode: '02115', lat: 42.3473, lng: -71.1048, riskLevel: 'high', entityCount: 89, avgRiskScore: 76, state: 'MA', city: 'Boston' },
      { zipCode: '02139', lat: 42.3656, lng: -71.1040, riskLevel: 'low', entityCount: 156, avgRiskScore: 43, state: 'MA', city: 'Cambridge' },
      
      // Denver Area
      { zipCode: '80202', lat: 39.7392, lng: -104.9903, riskLevel: 'medium', entityCount: 145, avgRiskScore: 58, state: 'CO', city: 'Denver' },
      { zipCode: '80210', lat: 39.6777, lng: -104.9613, riskLevel: 'low', entityCount: 189, avgRiskScore: 37, state: 'CO', city: 'Denver' },
      { zipCode: '80301', lat: 40.0150, lng: -105.2705, riskLevel: 'medium', entityCount: 123, avgRiskScore: 55, state: 'CO', city: 'Boulder' },
    ];
    
    setMapData(mockData);
    setLoading(false);
  };

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'low': return '#10b981'; // Green
      case 'medium': return '#f59e0b'; // Yellow/Orange
      case 'high': return '#ef4444'; // Red
      case 'critical': return '#7c2d12'; // Dark Red
      default: return '#6b7280'; // Gray
    }
  };

  const getRiskRadius = (entityCount: number): number => {
    // Scale radius based on entity count (min 8, max 25)
    return Math.min(25, Math.max(8, entityCount / 10));
  };

  const getRiskOpacity = (riskLevel: string): number => {
    switch (riskLevel) {
      case 'low': return 0.6;
      case 'medium': return 0.7;
      case 'high': return 0.8;
      case 'critical': return 0.9;
      default: return 0.6;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg ${className}`} style={{ height }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Default center: Geographic center of continental US
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 relative ${className}`} style={{ height }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <LayersControl position="topright">
          {/* Street Map Layer */}
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          {/* Satellite Layer */}
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          
          {/* Hybrid Layer (Satellite + Labels) */}
          <LayersControl.BaseLayer name="Hybrid">
            <>
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
              />
            </>
          </LayersControl.BaseLayer>
          
          {/* Terrain Layer */}
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          {/* Dark Mode Layer */}
          <LayersControl.BaseLayer name="Dark Mode">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <FitBounds data={mapData} />
        
        {/* Render markers */}
        {mapData.map((item, index) => (
            <CircleMarker
              key={`${item.zipCode}-${index}`}
              center={[item.lat, item.lng]}
              radius={getRiskRadius(item.entityCount)}
              pathOptions={{
                color: getRiskColor(item.riskLevel),
                fillColor: getRiskColor(item.riskLevel),
                fillOpacity: getRiskOpacity(item.riskLevel),
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-2 min-w-48">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{item.city}, {item.state}</h3>
                    <span 
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                        item.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        item.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        'bg-red-200 text-red-900'
                      }`}
                    >
                      {item.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zip Code:</span>
                      <span className="font-medium">{item.zipCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entities:</span>
                      <span className="font-medium">{item.entityCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Risk Score:</span>
                      <span className="font-medium">{item.avgRiskScore.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  {/* Risk Factors */}
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Industry Risk:</span>
                        <span>{(item.avgRiskScore * 0.35).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Professional Risk:</span>
                        <span>{(item.avgRiskScore * 0.40).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Financial Risk:</span>
                        <span>{(item.avgRiskScore * 0.25).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
      
      {/* Statistics Panel */}
      <div className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <h4 className="font-medium text-sm text-gray-900 mb-2">Statistics</h4>
        
        {/* Statistics */}
        <div className="space-y-1">
          <div className="text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total Locations:</span>
              <span className="font-medium">{mapData.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Entities:</span>
              <span className="font-medium">
                {mapData.reduce((sum, item) => sum + item.entityCount, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Risk Score:</span>
              <span className="font-medium">
                {(mapData.reduce((sum, item) => sum + item.avgRiskScore, 0) / mapData.length).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <h4 className="font-medium text-sm text-gray-900 mb-2">Risk Levels</h4>
        <div className="space-y-1">
          {[
            { level: 'low', label: 'Low (0-39)', count: mapData.filter(d => d.riskLevel === 'low').length },
            { level: 'medium', label: 'Medium (40-69)', count: mapData.filter(d => d.riskLevel === 'medium').length },
            { level: 'high', label: 'High (70-89)', count: mapData.filter(d => d.riskLevel === 'high').length },
            { level: 'critical', label: 'Critical (90+)', count: mapData.filter(d => d.riskLevel === 'critical').length }
          ].map(({ level, label, count }) => (
            <div key={level} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full border-2"
                  style={{ 
                    backgroundColor: getRiskColor(level),
                    borderColor: getRiskColor(level),
                    opacity: getRiskOpacity(level)
                  }}
                ></div>
                <span className="text-xs text-gray-600">{label}</span>
              </div>
              <span className="text-xs text-gray-500 ml-4">({count})</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Circle size = Entity count
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatMap;