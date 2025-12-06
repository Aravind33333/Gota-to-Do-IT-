import { useEffect, useState } from 'react';
import axios from 'axios'; // <-- Import axios here

function App() {
  // Use a different state variable for the count if you don't need it
  const [data, setData] = useState('');
  
  // Get the env variable
  const BASE_API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'; // Fallback added
  
  function fetchData() {
    // Call axios.get and chain the promise handlers
    axios.get(`${BASE_API}/`)
      .then((response) => {
        // Correctly call the state setter function
        setData(response.data.message); 
      })
      .catch(error => {
        // Handle any errors during the fetch
        console.error('Fetch error:', error);
        setData('Error loading message from API.');
      });
  }

  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div className="App">
      <h1 onLoad={fetchData}>{data}</h1>
    </div>
  )
}

export default App