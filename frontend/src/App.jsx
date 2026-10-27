import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [serverMessage, setServerMessage] = useState("Connecting to backend...");

  useEffect(() => {
    // Reaching out to your Express backend on port 5000
    axios.get('http://localhost:5000/api/test')
      .then((response) => {
        setServerMessage(response.data.message);
      })
      .catch((error) => {
        setServerMessage("Error connecting to backend: " + error.message);
      });
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Karachi Crime Risk Navigator</h1>
      <h2>Frontend Status: React is running!</h2>
      <div style={{ padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px', display: 'inline-block' }}>
        <h3>Backend Status:</h3>
        <p style={{ color: 'blue', fontWeight: 'bold' }}>{serverMessage}</p>
      </div>
    </div>
  );
}

export default App;