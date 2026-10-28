import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import axios from 'axios';

// CRITICAL: Leaflet maps will completely break and look like scrambled images without this CSS import
import 'leaflet/dist/leaflet.css'; 

function App() {
  const [serverMessage, setServerMessage] = useState("Connecting...");

  // Coordinates for the center of Karachi
  const karachiPosition = [24.8607, 67.0011];

  useEffect(() => {
    // Keep our backend health-check running
    axios.get('http://localhost:5000/api/test')
      .then((response) => setServerMessage(response.data.message))
      .catch(() => setServerMessage("Backend offline"));
  }, []);

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Navigation / Status Bar */}
      <div style={{ padding: '15px', backgroundColor: '#1e293b', color: 'white', textAlign: 'center', zIndex: 1000 }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '5px' }}>AI Crime Risk Navigator</h1>
        <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
          Backend Status: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{serverMessage}</span>
        </p>
      </div>

      {/* Interactive Map Container */}
      <MapContainer 
        center={karachiPosition} 
        zoom={13} 
        style={{ flexGrow: 1, width: '100%' }}
      >
        {/* The visual map tiles (OpenStreetMap) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {/* A test marker dropped in Karachi */}
        <Marker position={karachiPosition}>
          <Popup>
            <strong>Karachi City Center</strong> <br /> 
            Crime Risk: Calculating...
          </Popup>
        </Marker>
      </MapContainer>

    </div>
  );
}

export default App;