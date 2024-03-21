//plotting for each site monitored.
//needs to live update using an array of data and useState
//data processed in (), but just takes array and plots

import Plot from 'react-plotly.js';
// import "./Plotting.css";

const DataPlot = ({url, sampleRate, dataArray, intWindow, color}) => {
    //data is of the form of each individual website.
    // console.log('color',color)
    // const formatData = (data) =>
    // {

    // }

    // const computerDowntime = (dataArray) => {
    //     dataArray.length
    // }


    
    return (
    // <div className = 'data-plot'>
    //     DATA PLOT

    // </div>
    
    <Plot className = 'plot'
        data={[
          {
            x: dataArray.map((item,i) => i*sampleRate),
            y: dataArray,
            fill: 'tozeroy',
            // x: [0],
            // y: [1],
            type: 'scatter',
            mode: 'lines',
            marker: {color: color},
          },
        ]}
        layout={{
            title: `${url}`,
            
            // bargap: 0.8,
            paper_bgcolor: 'rgba(255,255,255,0)',
            plot_bgcolor: 'rgba(255,255,255,0)',
            xaxis: {title: 'time (seconds)'},
            yaxis: {title: 'latency (ms)'},

            width: 300,
            height: 250,
    } }
      />
      
    )

}


export default DataPlot

