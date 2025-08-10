import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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
      
      // Los Angeles Area
      { zipCode: '90210', lat: 34.0901, lng: -118.4065, riskLevel: 'low', entityCount: 234, avgRiskScore: 34, state: 'CA', city: 'Beverly Hills' },
      { zipCode: '90036', lat: 34.0739, lng: -118.3410, riskLevel: 'medium', entityCount: 156, avgRiskScore: 61, state: 'CA', city: 'Los Angeles' },
      { zipCode: '90028', lat: 34.1016, lng: -118.3267, riskLevel: 'high', entityCount: 89, avgRiskScore: 78, state: 'CA', city: 'Hollywood' },
      
      // Chicago Area
      { zipCode: '60601', lat: 41.8827, lng: -87.6233, riskLevel: 'medium', entityCount: 167, avgRiskScore: 55, state: 'IL', city: 'Chicago' },
      { zipCode: '60614', lat: 41.9290, lng: -87.6439, riskLevel: 'low', entityCount: 203, avgRiskScore: 42, state: 'IL', city: 'Chicago' },
      { zipCode: '60629', lat: 41.7764, lng: -87.7031, riskLevel: 'high', entityCount: 87, avgRiskScore: 76, state: 'IL', city: 'Chicago' },
      
      // Houston Area
      { zipCode: '77002', lat: 29.7589, lng: -95.3677, riskLevel: 'medium', entityCount: 134, avgRiskScore: 59, state: 'TX', city: 'Houston' },
      { zipCode: '77056', lat: 29.7596, lng: -95.4616, riskLevel: 'low', entityCount: 189, avgRiskScore: 38, state: 'TX', city: 'Houston' },
      { zipCode: '77026', lat: 29.8044, lng: -95.3478, riskLevel: 'critical', entityCount: 45, avgRiskScore: 91, state: 'TX', city: 'Houston' },
      
      // Phoenix Area
      { zipCode: '85001', lat: 33.4484, lng: -112.0740, riskLevel: 'high', entityCount: 112, avgRiskScore: 74, state: 'AZ', city: 'Phoenix' },
      { zipCode: '85016', lat: 33.5079, lng: -112.0362, riskLevel: 'medium', entityCount: 178, avgRiskScore: 52, state: 'AZ', city: 'Phoenix' },
      
      // Philadelphia Area
      { zipCode: '19102', lat: 39.9534, lng: -75.1639, riskLevel: 'medium', entityCount: 143, avgRiskScore: 56, state: 'PA', city: 'Philadelphia' },
      { zipCode: '19147', lat: 39.9295, lng: -75.1580, riskLevel: 'high', entityCount: 93, avgRiskScore: 77, state: 'PA', city: 'Philadelphia' },
      
      // San Antonio Area
      { zipCode: '78205', lat: 29.4241, lng: -98.4936, riskLevel: 'low', entityCount: 201, avgRiskScore: 41, state: 'TX', city: 'San Antonio' },
      { zipCode: '78216', lat: 29.5149, lng: -98.4683, riskLevel: 'medium', entityCount: 156, avgRiskScore: 63, state: 'TX', city: 'San Antonio' },
      
      // San Diego Area
      { zipCode: '92101', lat: 32.7157, lng: -117.1611, riskLevel: 'low', entityCount: 167, avgRiskScore: 39, state: 'CA', city: 'San Diego' },
      { zipCode: '92130', lat: 32.9595, lng: -117.1951, riskLevel: 'medium', entityCount: 134, avgRiskScore: 57, state: 'CA', city: 'San Diego' },
      
      // Dallas Area
      { zipCode: '75201', lat: 32.7767, lng: -96.7970, riskLevel: 'medium', entityCount: 145, avgRiskScore: 54, state: 'TX', city: 'Dallas' },
      { zipCode: '75230', lat: 32.8668, lng: -96.7670, riskLevel: 'high', entityCount: 89, avgRiskScore: 79, state: 'TX', city: 'Dallas' },
      
      // San Jose Area
      { zipCode: '95110', lat: 37.3382, lng: -121.8863, riskLevel: 'low', entityCount: 234, avgRiskScore: 36, state: 'CA', city: 'San Jose' },
      { zipCode: '95128', lat: 37.3230, lng: -121.9499, riskLevel: 'medium', entityCount: 167, avgRiskScore: 58, state: 'CA', city: 'San Jose' },
      
      // Austin Area
      { zipCode: '78701', lat: 30.2672, lng: -97.7431, riskLevel: 'low', entityCount: 189, avgRiskScore: 43, state: 'TX', city: 'Austin' },
      { zipCode: '78745', lat: 30.2138, lng: -97.8064, riskLevel: 'high', entityCount: 78, avgRiskScore: 81, state: 'TX', city: 'Austin' },
      
      // Jacksonville Area
      { zipCode: '32202', lat: 30.3322, lng: -81.6557, riskLevel: 'medium', entityCount: 123, avgRiskScore: 61, state: 'FL', city: 'Jacksonville' },
      
      // Fort Worth Area
      { zipCode: '76102', lat: 32.7555, lng: -97.3308, riskLevel: 'medium', entityCount: 134, avgRiskScore: 59, state: 'TX', city: 'Fort Worth' },
      
      // Columbus Area
      { zipCode: '43215', lat: 39.9612, lng: -82.9988, riskLevel: 'low', entityCount: 178, avgRiskScore: 45, state: 'OH', city: 'Columbus' },
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
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`} style={{ height }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds data={mapData} />
        
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
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200 z-10">
        <h4 className="font-medium text-sm text-gray-900 mb-2">Risk Levels</h4>
        <div className="space-y-1">
          {['low', 'medium', 'high', 'critical'].map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full border-2"
                style={{ 
                  backgroundColor: getRiskColor(level),
                  borderColor: getRiskColor(level),
                  opacity: getRiskOpacity(level)
                }}
              ></div>
              <span className="text-xs text-gray-600 capitalize">{level}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">Circle size = Entity count</p>
        </div>
      </div>
    </div>
  );
};

export default RiskHeatMap;