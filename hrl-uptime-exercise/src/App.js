import './App.css';
import Dashboard from './components/Dashboard';

function App() {

  return (
    <div className="App">
        {/* originally was going to have more components inside app, but Dashboard balooned a bit.
        would create more subcomponents for initialization module and plotting. */}
        <Dashboard></Dashboard>
    </div>
  );
}

export default App;
