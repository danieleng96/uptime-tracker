import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./ConfigNew.css";
import DataPlot from './Plotting';

// const backurl = 'http://localhost:5000/monitor'
// const backurl = 'http://localhost:5000/get-status'

//config new has the function of having user input saved by useState, creating a pseudo-form
//needs to have a place to enter url

const InitializeMetering = () => {

const [unitInterval, setUnitInterval] = useState(true)
const [unitSample, setUnitSample] = useState(false)
const [urlBase, setUrlBase] = useState('https://youtube.com')
const [url, setUrl] = useState('https://youtube.com')
const [port, setPort] = useState(false)
const [meter,setMeter] = useState(true)
//controls whether metering button disables or enables all metering
const [interval, setInterval] = useState(5)
const [sampleRate, setSampleRate] = useState(2)
const [dataObj, setDataObj] = useState({})
//data object is an object of arrays. may be obj of objs.
const [connTotal, setConnTotal] = useState(0);

const formatUrl= (urlString, portNumber) => {
    const fUrl = new URL(urlString);
    //formatted URL
    if (portNumber>0) 
    {fUrl.port = portNumber;
    }
    // Convert the URL object back to a string

    setUrl(fUrl.toString()
    );
    return fUrl.toString()
}

// console.log(dataObj)
const colors = [
    "#ffd700",
    "#ffb14e",
    "#fa8775",
    "#ea5f94",
    "#cd34b5",
    "#9d02d7",
    "#0000ff"
]



const updateData = ({url, intWindow, sr, incomingData, tf}) => {

    //number of elements is intWindow/sr to maintain small enough data window.
    const dataLen = Math.floor(intWindow/sr)
    //get last time

    // finds window, but might be too slow
    const calcWindow = (timeArr, intWindow) => {
    const targetTime = timeArr[timeArr.length-1]-intWindow*1000
    for(var i=0, l=timeArr.length; i<l; i++){
        if(timeArr[i] > targetTime){
            console.log('index',i)
          return i
        }}}
    // if (Object.keys(dataObj).includes(url))

    //     {let window = calcWindow(dataObj[url].data, intWindow)
    //     console.log('calculated window',window, 's')}

    // [...(prevDataObj[url]?.data.slice(-(dataLen+1)) || []),incomingData]
    //new array if data is paused

    setDataObj((prevDataObj) => 
        ({
        ...prevDataObj,
        [url]:
    {
        ["intWindow"]: prevDataObj[url]?.intWindow || intWindow,
        ["sampleRate"]: prevDataObj[url]?.sampleRate || sr,
        ["color"]: prevDataObj[url]?.color || colors[Object.keys(prevDataObj).length%(colors.length+1)],
        ["data"]:[...(prevDataObj[url]?.data || []),incomingData],
        ["time"]:[...(prevDataObj[url]?.time || []),tf],
        // ["data"]:[...(prevDataObj[url]?.data.slice(calcWindow(prevDataObj[url].data,intWindow)) || []),incomingData],
        // ["time"]:[...(prevDataObj[url]?.time.slice(calcWindow(prevDataObj[url].data,intWindow)) || []),tf]
    }})

        // [url]:{
        // ["intWindow"]: intWindow,
        // ["sampleRate"]: sr,
        // ["color"]: prevDataObj[url]?.color || colors[Object.keys(prevDataObj).length%(colors.length+1)],
        // ["data"]:[...(prevDataObj[url]?.data.slice(calcWindow(prevDataObj[url]?.data,intWindow)) || []),incomingData],
        // ["time"]:[...(prevDataObj[url]?.time.slice(calcWindow(prevDataObj[url]?.data,intWindow)) || []),tf]}})
        //add in window slicing here, so the data does not get too large.
        //colors repeat, would configure differently if needed
        //intWindow/sr (sampleRate) to get number of datapoints that should be collected.
        )
        // Append incoming data to the existing array
    };

    const handleDeleteUrl = ({urlKey}) => {
        setDataObj(current => {
            const newDataObj = { ...current };
            delete newDataObj[urlKey];
            return newDataObj;
        });
    };        

const meteringTog = ({type,u,bool}) => {
    //this could be done in http

    const wsTog = new WebSocket('ws://localhost:5000');

    wsTog.onopen = () => {
   
    // wsTog.send(JSON.stringify({type:`metering${meter?'On':'Off'}`, body: ''}))
        console.log('metering:', meter)
        wsTog.send(JSON.stringify({type:type, body: {on:!bool,u:u}}))
        if (u === 'all')
        {setMeter(!meter)}

        wsTog.close()
    };
        
    wsTog.onclose = () => {
        console.log('Meter Tog disconnected (client)');
        //   handleDeleteUrl(ws.id)
    };}

const initWebSocket = (url) => {

    const ws = new WebSocket('ws://localhost:5000');

  ws.onopen = () => {

    console.log('WebSocket connected', dataObj);


    if (Object.keys(dataObj).includes(url)) {
        handleDeleteUrl({urlKey :url})
        console.log('removed previous data,', url)
    } else {console.log([url], typeof(url), Object.keys(dataObj))}

    const msgInit = {
        type:'initInterval',
        body:{
        url:url,
        sampleRate:sampleRate*(unitSample? 60:1),
        intWindow:interval*(unitInterval? 60:1),
        }
    
    }
    ws.send(JSON.stringify(msgInit))
    //this sends the message with the url and sample rate from the useState defined variables above.
    //the unitSample determines if True = minutes, False = seconds
    setConnTotal(connTotal+1)
  };

  ws.onmessage = function (e) {
    const json = JSON.parse(e.data);
    const type = json.type
    // console.log('Server: ', e.data, typeof(e.data));
    switch (type) {
        case 'stream':
    // console.log(json.url, json.latency)
    updateData({
        url : json.url,
        sr : json.sampleRate,
        incomingData : json.latency,
        intWindow : json.intWindow,
        tf : json.tf,
    });
    // console.log('pro',dataObj)
    break;

        case 'pause':
            updateData(
                {
                    url : json.url,
                    // sr : json.sampleRate,
                    sr:null,
                    incomingData : -1,
                    //set negative number for y value so I can split this later
                    intWindow:null,
                    // intWindow : json.intWindow,
                    tf : json.tf,
                }
            )
    break;}

;}

  ws.onclose = () => {
      console.log('WebSocket disconnected (client)');
    //   handleDeleteUrl(ws.id)
  };}


const uptimeCalc = (obj) => {

    //takes the sub object of data, meaning dataObj[url]

    //uptime calculated, percentage with 1 decimal place.
    //filter out -1 which mark pauses in data

    let [data,times,intWindow] = [obj["data"],obj["time"],obj["intWindow"]]

    times = times.filter((time) => time > (times[times.length-1]-intWindow*1000))
    data = data.slice(-(times.length))
    const filData = data.filter((el) => el !== -1)
    //filter out the -1, these show pauses of data
    return Math.round(1000*(filData.length-filData.filter(
        (el) => el == 0).length)/filData.length)/10

}



return (
    <div className = "page-container">
        <div className = "init-container">
        <div className = "upper-container input-container">
        <label className = 'input-row'>
                Enter URL/Port<input
                className = 'input-box'
                id="url-input"
                value={urlBase}
                onChange={e => {
                    setUrlBase(e.target.value);
                }}

                />
            
                <input
                className = 'input-box'
                label='port'
                id="port-input"
                type="number"
                placeholder="enter port"
                value={port}
                // onMouseOver={e => }
                onChange={e =>
                    {setPort(e.target.value);
                    // formatUrl(urlBase, e.target.value);

                }}
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

        {/* <button
        onClick = {urlPostReq}>Submit</button> */}
        {meter?<button
    onClick = 
    {()=>{
        
        initWebSocket(formatUrl(urlBase,port))}}
    >Set Connection</button>:<></>}
    {Object.keys(dataObj).length>0?
    <button
    className = {`meter-button ${meter ? 'On' : 'Off'}`}
    onClick ={()=>meteringTog({type:'metering',u:'all',bool:meter})}>{meter?'Pause Metering':'Start Metering'}</button>:<></>}
        <table>
  <tr>
    <th>URL</th>
    <th>Sampling
        Rate</th>
    <th>Listening
        Window</th>
    <th>Uptime</th>
    <th>Active?</th>
    <th>Latest Sample</th>

  </tr>
  {Object.keys(dataObj).length>0?
    Object.keys(dataObj).map((urlKey)=>

<tr style={{ backgroundColor: dataObj[urlKey]["color"] }}>
    <td>{urlKey}</td>
    <td>{dataObj[urlKey]["sampleRate"]} s</td>
    <td>{dataObj[urlKey]["intWindow"]} s</td>
    <td>{uptimeCalc(dataObj[urlKey])}%</td>
    {/* <td>{(dataObj[urlKey].data.length-1)*dataObj[urlKey]["sampleRate"]} s</td> */}
    <td>{meter?'active':'paused'}</td>
    <td>{dataObj[urlKey]["time"]?(Math.round((dataObj[urlKey]["time"][dataObj[urlKey]["time"].length-1]-dataObj[urlKey]["time"][0])/1000)):''} s</td>

    {/* check both meter (the metering boolean) and individual connection */}

  </tr>):<div></div>}
</table>
        
        </div>
            <div className="plot-screen">
            <div className = {`plot-wrapper ${meter?'On':'Off'}`}>
            
        
            {Object.keys(dataObj).length>0?
            
            Object.keys(dataObj).map((urlKey)=>
            <div>
        <DataPlot
            url = {urlKey}
            sampleRate = {dataObj[urlKey]["sampleRate"]}
            intWindow = {dataObj[urlKey]["intWindow"]}
            dataArray={dataObj[urlKey]["data"]}
            timeArray={dataObj[urlKey]["time"]}
            color={dataObj[urlKey]["color"]}
            

            ></DataPlot>
            <div
            className = 'graph-data-holder'>
            <h2>Uptime: {uptimeCalc(dataObj[urlKey])}%</h2>

            
            <button
            className = 'delete-button'
            onClick = {()=>{
                meteringTog({type:'delete',u:urlKey,bool:false});
                handleDeleteUrl({urlKey});}}
            >Remove Connection</button>
            </div>
            {/* <button
            onClick ={
                ()=>
                meteringTog({type:'metering',u:urlKey,bool:!dataObj[urlKey]["active"]})
                
        }
            >Pause</button> */}

            </div>
            
                ):<p>   <h1>Launch Instructions</h1>
                        <h2>to initialize a site,</h2>
                        <h2>1. Enter Url/Port</h2>
                        <h2>2. Enter the sample rate</h2>
                        <h2>3. Enter the interval window</h2>
                        <h2>4. Click "Set Connection" button</h2>

                        <h1>Metering</h1>
                        <h2>Global metering button "Toggle Metering" button</h2>
                        <h2>This will allow you to pause, zoom, or extract data</h2>
                        <h2>When screen is green, charts are active.</h2>
                        
                        </p>}
            </div>


</div>
            

         
        
</div>

)

}

export default InitializeMetering