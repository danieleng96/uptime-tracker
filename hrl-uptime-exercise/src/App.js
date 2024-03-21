import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DataPlot from './components/Plotting';
import InitializeMetering from './components/ConfigNew';

function App() {

  const [data, setData] = useState(0);


// useEffect(() => {
//   const ws = new WebSocket('ws://localhost:5000');

//   ws.onopen = () => {
//       console.log('WebSocket connected');
//   };

//   ws.onmessage = event => {
//     console.log('event occuring!!')
//       const newData = parseInt(data)+parseInt(JSON.parse(event.data)['d']);
//       setData(newData);

//       console.log(data, newData)

//   };

//   ws.onclose = () => {
//       console.log('WebSocket disconnected');
//   };

//   return () => {
//       ws.close();
//   };
// }, []);


  

// const getRequest = async () => {
//     try {
      
//         const response = await axios.get('http://localhost:5000/check-website-status');
//         console.log('site up', response);
    
//     }
//     catch (e) {
//         console.log('fetch error c:',e);
//     }
// };

  return (
    <div className="App">
      
      <header className="App-header">


        <InitializeMetering></InitializeMetering>

      </header>

    </div>
  );
}

export default App;
