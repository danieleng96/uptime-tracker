//plotting for each site monitored.
//needs to live update using an array of data and useState
//data processed in (), but just takes array and plots

import Plot from 'react-plotly.js';
// import "./Plotting.css";

const DataPlot = ({url, dataArray, intWindow, color, timeArray}) => {
    //data is of the form of each individual website.
    // console.log('color',color)
    // const formatData = (data) =>
    // {
    // let indices = []
    const splitUrl = new URL(url)
    const maxVal= Math.max(...dataArray
        );

    console.log(maxVal)

    const t0 = timeArray[0]
    const tf = timeArray[timeArray.length-1]


    const zeroIndices = dataArray.reduce((indices, value, index) => {
        if (value === 0) indices.push(index); 
        return indices;
        }, []);
    
    const splitArraysAtValue = (dArray, tArray) =>{
        // Find indices where the value matches in dataArray
        const value = -1
        const dataPlot = ([tArray,dArray]) =>
        
        {
            return {
            
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

    // dataSplits = splitArraysAtValue(dataArray, tArray)


    // const rectangles = zeroIndices.map((zeroIndex, index) => ({
    //     type: 'rect',
    //     xref: 'x',
    //     yref: 'paper',
    //     x0: zeroIndex,
    //     y0: 0,
    //     x1: index < zeroIndices.length - 1 ? zeroIndices[index + 1] : zeroIndex + sampleRate,
    //     y1: 1,
    //     fillcolor: '#ff0008',
    //     opacity: 0.3,
    //     line: {
    //         width: 0
    //     }
    // }));

    // }

    // const computerDowntime = (dataArray) => {
    //     dataArray.length
    // }
    // const pushXY = (x,y,item,index) => {
        
    //         x.push(index*sampleRate);
    //         y.push(item)
    // }

    // const findZeros = (data) => {
    //     let x = []
    //     let y = []
    //     data
    // .map((item, index) => ({ item, index }))
    // .filter(({ item }) => item == 0)
    // .forEach({ item, index}) => (
    //     pushXY(x,y,item,index);
    //     )
    //     return [x,y]
    
    // }
        // y.push(item));
    

    // let zeros = findZeros(dataArray)
    
    // const dataSplits = co
    
    return (
    // <div className = 'data-plot'>
    //     DATA PLOT

    // </div>
    
    <Plot className = 'plot'
        data={[

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
                family: 'Courier New, monospace',
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

