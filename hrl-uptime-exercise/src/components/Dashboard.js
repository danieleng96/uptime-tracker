//React.js frontend. takes in data in form of initializations, starts plots,
//communicates with server which is in hrl-uptime-exercise/server/index.js








import React, { useState } from 'react';
import "./Dashboard.css";
import DataPlot from './Plotting';




const Dashboard = () => {

const [unitInterval, setUnitInterval] = useState(true)
const [unitSample, setUnitSample] = useState(false)
const [baseUrl, setBaseUrl] = useState('https://youtube.com')
//baseUrl is without port, this can include full other url.
const [url, setUrl] = useState('https://youtube.com')
//using formatUrl sets on button press to insert port into the baseUrl
const [port, setPort] = useState(false)
const [meter,setMeter] = useState(true)
//controls whether metering button disables or enables all metering
const [interval, setInterval] = useState(5)
const [sampleRate, setSampleRate] = useState(2)

//does not have persistence on refresh, refresh is how to reset all at once
//to add persistence I would use react's JS-cookie, save the dataObj in cookies,
//create init function to loop through each url and params to reEnter stale connections and intervals

const [dataObj, setDataObj] = useState({})

// colors to differentiate plot and table rows
//sliiiight bug in that if you update the same url's plot after others have been initialized, different plots will use the same colors. minor bug
const colors = [
    "#ffd700",
    "#ffb14e",
    "#fa8775",
    "#ea5f94",
    "#cd34b5",
    "#9d02d7",
    "#0000ff"
]

//data object is an  obj of objs.
//dataObj = {keys = url:{keys = color, intWindow, sampleRate, data, time}}

// const [connTotal, setConnTotal] = useState(0);
//shows total connections, not used

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

const updateData = ({url, intWindow, sr, incomingData, tf}) => {
    //updateData is called on websocket messages to read incoming data.
        // data format is
            //dataObj = {keys = url:{keys = color, intWindow, sampleRate, data, time}}

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
    
    }})
        //in previous version, window of data would slice based on number of samples to reduce overall size of data packet.
        //with metering pause this got more complicated, would add a data slicer to final product 
        )
        // Append incoming data to the existing array
    };

    const handleDeleteUrl = ({urlKey}) => {
        //deletes existing graph and data from dataObj if the url exists.
        setDataObj(current => {
            const newDataObj = { ...current };
            delete newDataObj[urlKey];
            return newDataObj;
        });
    };        

const meteringTog = ({type,u,bool}) => {
    //sends metering or toggling values to server to alter intervals

    const wsTog = new WebSocket('ws://localhost:5000');

    wsTog.onopen = () => {
   
        // console.log('metering:', meter)
        wsTog.send(JSON.stringify({type:type, body: {on:!bool,u:u}}))
        //bool will be 'all' for toggling metering, this will pause all client's intervals, but not remove them
        if (u === 'all')
        {setMeter(!meter)}

        wsTog.close()
        //close connection after sending. this command could be done with http, does not need to be stateful but backend was set up for this.
        //would rewrite as post request
    };
        
    wsTog.onclose = () => {
        console.log('Meter Tog disconnected (client)');
    };}

const initWebSocket = (url) => {
    //sets up an interval with url as the key.
    const ws = new WebSocket('ws://localhost:5000');

  ws.onopen = () => {

    console.log('WebSocket connected', dataObj);

    if (Object.keys(dataObj).includes(url)) {
        handleDeleteUrl({urlKey :url})
        //remove plot and dataObj if url already sending data.
        console.log('removed previous data,', url)
    } else {console.log([url], typeof(url), Object.keys(dataObj))}

    const msgInit = {
        //type is to determine what case the server will handle, initInterval starts an interval with the body values below
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
    // setConnTotal(connTotal++)
    //unused, but can show total connections, remove when delete connection.
  };

  ws.onmessage = function (e) {
    //message can be either stream of pause
    console.log(e)
    //stream takes data and continues to receive interval data, pause sends the last data latency=-1, which the plot takes as a pause signal
    const json = JSON.parse(e.data);
    const type = json.type

    switch (type) {
        case 'stream':
            
            //typical stream case
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
            //when user enters pause, will send a -1 as signal to split data array. hack workaround
            updateData(
                {
                    url : json.url,
                    sr:null,
                    //does not need samplerate
                    incomingData : -1,
                    //set negative number for y value so I can split this later in Plotting.js
                    intWindow:null,
                    tf : json.tf,
                    //tf is final time, important to show when pause happened
                }
            )
    break;}

;}

  ws.onclose = () => {
      console.log('WebSocket disconnected (client)');
    //   handleDeleteUrl(ws.id)
  };}

//extracts port and combines baseUrl and port
  const formatUrl = (urlString, portNumber) => {
    try{
    const fUrl = new URL(urlString);
    //formatted URL
    if (portNumber>0) 
    {fUrl.port = portNumber;
    }
    // Convert the URL object back to a string

    setUrl(fUrl.toString()
    );
    return fUrl.toString()}
    catch (e) {
        return urlString
    }
}


//classNames instead of Id in case of reUsing css terms.

//return is quite large, the structure should be broken into more subcomponents (only plotting.js is separate)
//I would break the init container into a separate component and pass the states and handles to it.

return (
    <div className = "page-container">
        <div className = "init-container">
            <div className='tab-title'>Initialize Data</div>
            {/* initialization has slight bug, will not show good data if interval window < sample rate,
            or if you enter negative numbers for these. would add validators to more finished product*/}
        <div className = "upper-container input-container">
        
        <label className = 'input-row'>
                Enter URL/Port<input
                className = 'input-box'
                id="url-input"
                value={baseUrl}
                onChange={e => {
                    setBaseUrl(e.target.value);
                }}
                />
                <input
                className = 'input-box'
                label='port'
                id="port-input"
                type="number"
                placeholder="enter port"
                value={port}
                onChange={e =>
                    {setPort(e.target.value);
                }}
                />
            </label>
        </div>
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
        {meter?<button
    onClick = 
    {()=>{
        //this button will set connection after defining url and interval vals! important for basic functioning of app
        initWebSocket(formatUrl(baseUrl,port))}}
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
            <div className='tab-title'>Data Display Screen</div>

            <div className = {`plot-wrapper ${meter?'On':'Off'}`}>

            
        
            {Object.keys(dataObj).length>0?
            
            Object.keys(dataObj).map((urlKey)=>
            <div>
        <DataPlot
        // {url, dataArray, intWindow, color, timeArray}
            url = {urlKey}
            // sampleRate = {dataObj[urlKey]["sampleRate"]}
            intWindow = {dataObj[urlKey]["intWindow"]}
            dataArray={dataObj[urlKey]["data"]}
            timeArray={dataObj[urlKey]["time"]}
            color={dataObj[urlKey]["color"]}
            

            ></DataPlot>
            <div
            className = 'graph-data-holder'>
            <h2>Uptime: {uptimeCalc(dataObj[urlKey])}% 
            over {dataObj[urlKey]["time"]
            ?
            (Math.min(...[dataObj[urlKey]["intWindow"],
            Math.round((dataObj[urlKey]["time"][dataObj[urlKey]["time"].length-1]-dataObj[urlKey]["time"][0])/1000)]))
            :''
            } s</h2>

            
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
                        <h2>Set unit by clicking bubble next to input window</h2>
                        <h2>4. Click "Set Connection" button</h2>
                        <h2>5. Update connection by entering same Url with different parameters</h2>
                        <h2>6. Delete connection by clicking delete button</h2>



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

export default Dashboard