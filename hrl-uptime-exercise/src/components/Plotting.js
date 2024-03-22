//plotting for each site monitored.
//tracks pauses by looking for -1 values in dataArray and finding same index in dataArray
//finds zeros by looking for 0.
//zeros will plot separately, an outage is labelled with a red 'x' and plotted with latency = 0

import Plot from 'react-plotly.js';
// import "./Plotting.css";

const DataPlot = ({url, dataArray, intWindow, color, timeArray}) => {
    console.log(dataArray)
    const splitUrl = new URL(url)
    //split url to use in plot to show port, protocol, etc

    const t0 = timeArray[0]
    const tf = timeArray[timeArray.length-1]
    //first and last time for use later

    const zeroIndices = dataArray.reduce((indices, value, index) => {
        //find zeros in dataArray
        if (value === 0) indices.push(index); 
        return indices;
        }, []);
    
    const splitArraysAtValue = (dArray, tArray) =>{
        // Find indices where the value matches in dataArray
        // value of -1 indicates a pause in metering, and split array
        const value = -1
    const dataPlot = ([tArray,dArray]) =>
        
        {
            return {
            //this is my template for each successful plot
            name: 'Response Times',
            x: tArray,
            x: tArray.map(item=>(item-t0)/1000),

            y: dArray,
            fill: 'tozeroy',
            type: 'scatter',
            mode: 'lines',
            marker: {
                color: color
            }
        }
    }
        // I pass in a -1 from the websocket to indicate a pause

        const indices = dArray.reduce((acc, curr, index) => {
            if (curr === value) {
                acc.push(index);
            }
            return acc;
        }, []);
    
        // Add the last index if the last element of dataArray is the value
        if (dArray[dArray.length - 1] === value) {
            indices.push(dArray.length - 1);
        }
    
        // Split both Arrays at the found indices
        const result = [];
        let start = 0;
        indices.forEach((index) => {
            result.push(dataPlot([tArray.slice(start, index), dArray.slice(start, index)]));
            start = index + 1;
        });
    
        // Add the remaining elements after the last index
        if (start < dArray.length) {
            result.push(dataPlot([tArray.slice(start), dArray.slice(start)]));
        }
    

        

        return result;

    }
    
    return (
  
    <Plot className = 'plot'
        data={[
            //plots each split data array (splits occur when metering is turned off, different from outages where response is zero.)
        ...splitArraysAtValue(dataArray, timeArray), 


        {   name: 'Outage',
            x: zeroIndices.map(ind=>(timeArray[ind]-t0)/1000),
            y: zeroIndices.map(i=>0),
            type: 'scatter',
            mode: 'markers',
            // fill: 'tozeroy',

            
            marker: {
                symbol: 'x',
                color: '#ff0008'
                // dataArray.map(d => d === 0 ? color : color),
            },
        },
       

    ]}
        layout={{
            
            title: {
                text: `Host ${splitUrl.hostname}<br>Protocol ${splitUrl.protocol}${splitUrl.port?`<br>Port:${splitUrl.port}`:''}`,
                font: {
                // family: 'Courier New, monospace',
                size: 15}},
                
            showlegend: false,
            paper_bgcolor: 'rgba(255,255,255,0.1)',
            plot_bgcolor: 'rgba(255,255,255,0.5)',
            xaxis: {title: `time (seconds)`,
            range: [(tf-t0)/1000-intWindow, (tf-t0)/1000]},
            yaxis: {title: 'latency (ms)'},

            width: 300,
            height: 250,
    } }
      />
      
    )

}


export default DataPlot

