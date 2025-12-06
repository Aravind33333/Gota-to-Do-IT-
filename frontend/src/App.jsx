import React, { useEffect, useState } from 'react';
import axios from 'axios'; // <-- Import axios here
import SignIn from './signIn';
function App() {
  // Use a different state variable for the count if you don't need it
  const [data, setData] = useState('');
  const [connection,setConnection]=useState(null);
  // Get the env variable
  const BASE_API = import.meta.env.VITE_API_BASE_URL;
  
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
  //Logic code used when the check connectivity button is clicked using a loading state in the frontend
  const [loading, setLoading] = useState(false);
  
  function handleConnection() {
    setLoading(true);
    axios.get(`${BASE_API}/connect_db`).then((response) => {
      console.log(response.data);
      if (response.data.message) {
        alert(response.data.message);
        setConnection(true);
        setLoading(false);
      } else if (response.data.error) {
        alert('Database error: ' + response.data.error);
        setConnection(false);
        setLoading(false);
      }
    }).catch(error => {
      console.error('Connection error:', error);
      alert('Error connecting to the database.');
      setConnection(false);
      setLoading(false);
    });
  }
  
  return(
  <>
  <div className="App">
      <h1 onLoad={fetchData}>{data}</h1>
      <button onClick={handleConnection}>Check Connectivity</button>
      {connection === true && (<p>Database Connected Successfully!</p>)}
      {connection === false && (<p>Database Not Connected.</p>)}
      {loading && (<p>Loading...</p>)}
      
      <hr />
      <SignIn />
    </div>
  </>
  );
}

export default App