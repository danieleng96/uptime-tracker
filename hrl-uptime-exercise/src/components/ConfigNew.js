import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./ConfigNew.css";
import DataPlot from './Plotting';

// const backurl = 'http://localhost:5000/monitor'
const backurl = 'http://localhost:5000/get-status'

//config new has the function of having user input saved by useState, creating a pseudo-form
//needs to have a place to enter url

const InitializeMetering = () => {

const [unitInterval, setUnitInterval] = useState(true)
const [unitSample, setUnitSample] = useState(false)
const [url, setUrl] = useState('https://google.com/')
const [interval, setInterval] = useState(5)
const [sampleRate, setSampleRate] = useState(2)
const [dataObj, setDataObj] = useState({})
//data object is an object of arrays. may be obj of objs.
const [connTotal, setConnTotal] = useState(0);

// console.log(dataObj)
const colorMap = []
const colors = [
    "#ffd700",
    "#ffb14e",
    "#fa8775",
    "#ea5f94",
    "#cd34b5",
    "#9d02d7",
    "#0000ff",   
    
"#980015",
"#ffbd5c",
"#ffdf4b",
"#f2d850",
"#fff3c7",
"#e4ffbb",
"#76e800",
"#005d54",
"#009086",
"#00ffff",
"#003a67",
"#839acd",
"#007de8",
"#00328a",
"#4110ae",
"#c960fd",
"#ffb8ff",
"#ffb8f5",
"#ff75cb",
"#f75cb3"]


const updateData = ({url, intWindow, sr, incomingData}) => {
    // console.log('roger',url, intWindow, sr)
    console.log(colors)
    //number of elements is intWindow/sr to maintain small enough data window.
    const dataLen = Math.floor(intWindow/sr)

    setDataObj((prevDataObj) => 
        ({
        ...prevDataObj,
        [url]:{["intWindow"]: intWindow, ["sampleRate"]: sr, ["color"]: prevDataObj[url]?.color || colors[Object.keys(prevDataObj).length],["data"]:[...(prevDataObj[url]?.data.slice(-(dataLen)) || []),incomingData]}})
        //add in window slicing here, so the data does not get too large. intWindow/sr (sampleRate) to get number of datapoints that should be collected.
        )
        // Append incoming data to the existing array
    };

    


//these useStates are to set whether the minute or second value is toggled



// const urlPostReq = async () => {
//     try {
//         const response = await axios.post(backurl, {url, sampleRate});
//     }
//     catch (e) {

//         console.log('post error:', e, url, sampleRate, unitSample);
//       }

// }

const initWebSocket = () => {
    // if (!!ws) {
    //     ws.close();
    // }
    
    const ws = new WebSocket('ws://localhost:5000');

  ws.onopen = () => {

    console.log('WebSocket connected');
    ws.send(JSON.stringify([url,sampleRate*(unitSample? 60:1),interval*(unitInterval? 60:1)]))
    //this sends the message with the url and sample rate from the useState defined variables above.
    //the unitSample determines if True = minutes, False = seconds
    setConnTotal(connTotal+1)
  };

  ws.onmessage = function (e) {
   
    console.log('Server: ', e.data, typeof(e.data));
    const json = JSON.parse(e.data);
    // console.log(json.url, json.latency)
    updateData({
        url : json.url,
        sr : json.sampleRate,
        incomingData : json.latency,
        intWindow : json.intWindow
    });
    // console.log('pro',dataObj)
  };

  ws.onclose = () => {
      console.log('WebSocket disconnected (client)');
  };}

     

const uptimeCalc = (data) => {

    console.log('uptime:',data)
}


return (
    <div className = "page-container">
        <div className = "init-container">
        <div className = "upper-container input-container">
        <label className = 'input-row'>
                Enter URL<input
                className = 'input-box'
                name="url-input"
                value={url} onChange={e => setUrl(e.target.value)}
                />
            </label>
        </div>
        {/* <div>
        {dataObj.map((d) => d+' ,')}
        </div> */}
        
        <div className = "lower-container input-container">
            
        <label className = 'input-row'>
                Select Interval Window<input
                className = 'input-box'
                type="number"

                name="interval-input"
                value={interval} onChange={e => setInterval(e.target.value)}
                />
                <div className = {`unit-toggle ${unitInterval ? 'min' : 'sec'} ut-int`}
                onClick = {()=>{setUnitInterval(!unitInterval)}}>
                {unitInterval ? 'min' : 'sec'}
            </div>
            </label>
            
            </div>
            <div className = "lower-container input-container">

            {/* <h1 className = "sampling-title">
                Select Sample Rate
            </h1> */}
            <label className = 'input-row'>
                Set Sample Rate <input
                className = 'input-box'
                type="number"
                name="sampling-input"
                value={sampleRate} onChange={e => {setSampleRate(e.target.value)}}
                />
                <div className = {`unit-toggle ${unitSample ? 'min' : 'sec'} ut-samp`}
                onClick = {()=>{setUnitSample(!unitSample)}}>
                {unitSample ? 'min' : 'sec'}

                </div>
            </label>
            
            
            
        </div>
        <div>
            total connections:{connTotal || 'placeholder'}
        </div>
        {/* <button
        onClick = {urlPostReq}>Submit</button> */}
    <button
    onClick = {initWebSocket}>Initialize Metering</button>
        </div>
            <div className="plot-screen">
            <div className = "plot-container">
        <div>
            {Object.keys(dataObj).length>0?
            Object.keys(dataObj).map((urlKey)=>
        <DataPlot
            url = {urlKey}
            sampleRate = {dataObj[urlKey]["sampleRate"]}
            intWindow = {dataObj[urlKey]["intWindow"]}
            dataArray={dataObj[urlKey]["data"]}
            color={dataObj[urlKey]["color"]}

            ></DataPlot>):<div></div>}
            <div/>
            </div>
            </div>

            <table>
  <tr>
    <th>URL</th>
    <th>Sampling Rate (s)</th>
    <th>Listening Window (s)</th>
    <th>Downtime %</th>
    <th>Elapsed Time (s)</th>
  </tr>
  {Object.keys(dataObj).length>0?
    Object.keys(dataObj).map((urlKey)=>

<tr style={{ backgroundColor: dataObj[urlKey]["color"] }}>
    <td>{urlKey}</td>
    <td>{dataObj[urlKey]["sampleRate"]} s</td>
    <td>{dataObj[urlKey]["intWindow"]} s</td>
    <td>{uptimeCalc(dataObj[urlKey]["data"])}</td>
    <td>{dataObj[urlKey].data.length*dataObj[urlKey]["sampleRate"]}</td>
  </tr>):<div></div>}
</table>
</div>
            

         
        
</div>

)

}

export default InitializeMetering