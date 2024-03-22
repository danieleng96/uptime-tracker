//index.js is an express.js upgraded http and websocket server.
//although I do not use the http capabillity, I think the toggling functions could be done using this for better results
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ws = require('ws')



const app = express();
const port = 5000;
const httpServer = app.listen(port)

const wss = new ws.Server({ noServer : true })
//noServer = true because I will upgrade the http server. might not be necessary

httpServer.on('upgrade', (req,socket, head) => {

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
    })
})

app.use(express.json());
app.use(cors()); // Use cors middleware. reason I started backend server was because I ran into CORS problems with React.js browser only app

const sendGet = async (url, sampleRate, intWindow) => {
    //send get request to a url, measures latency by simple Data.now() subtraction
    //only takes sampleRate and intWindow to collect params into single packet
        const inputData = {
            type: 'stream',
            url: url,
            sampleRate: sampleRate,
            intWindow: intWindow,
        }

            try {
                const t0 = Date.now();
                const resp = await axios.get(url);
                const latency = Date.now() - t0
                return {
                    ...inputData,
                    status: resp.status,
                    latency: latency,
                    tf: t0 + latency
                };  
                } catch (e) {
                return {
                    ...inputData,
                    status: e.response ? e.response.status : 0,
                    latency: 0,
                    tf: Date.now()
                };
            }}

const toggleSingle = (on, client) => {
    //clears interval, if message.type = 'pause', will also send the pause request to pause data displays
    //in metering case, each client runs this function

    if (client.intVals)
    {
        clearInterval(client.interval);
             {
            if (on)
                {sendAndUpdateInterval(client);
                    console.log(client.id)
                }
            else {
                client.send(JSON.stringify({type: 'pause', url: client.id, tf:Date.now()}))}
                console.log('pause', client.id)
            }}}


wss.on('connection', (ws) => {
    //basic connection, will connect on both metering messages and interval init messages
    console.log('connected to client');

    ws.on('message', (packet) => {
        const message = JSON.parse(packet.toString());
        const { type, body} = message;
        switch (type) {
            //need cases to handle: turning on/off all connections: delete connection: initInterval(make connection)
            case 'metering':
            
                if (body.u === 'all') {
                if (wss.clients) {
                    wss.clients.forEach(client => {                    
                            toggleSingle(body.on, client)})}}
                    
                            else
                {
                    if (wss.clients) {
                        wss.clients.forEach(client => {  

                            //if body.u (url) is not === all, this means we should disable only a single url. Currently not using this case,
                            //but would be useful for an individual pause button

                            if (client !== ws && client.id === body.u) {   
                                toggleSingle(body.on, client)}
                                //disable connection for both
                                //if on should reconnect
                                // Terminate connection
                    })}
                }
                break;
         
            case 'delete':
                //delete message is sent by client button, will stop interval and remove client, closing connection.
                wss.clients.forEach(client => {
                    //remove all duplicate clients, clear their intervals, terminate connections
                if (client !== ws && client.id === body.u) {
                    client.close()
                }})
                break

            case 'initInterval':
                //init interval, when connection is first made, sets interval and url to get data. can be overwritten.
                const {url, sampleRate, intWindow } = body;
                console.log(type,url)

                wss.clients.forEach(client => {
                    //remove all duplicate clients, clear their intervals, terminate connections
                if (client !== ws && client.id === url) {
                    console.log('Closing existing connection with the same identifier');
                    clearInterval(client.interval); // Clear the interval fromprevious client
                    client.terminate(); // Terminate connection
                }
                });

                // set samplerate and intervalwindow for the current ws client
                ws.id = url;
                ws.sampleRate = sampleRate;
                ws.intWindow = intWindow;
                ws.intVals = {url,sampleRate,intWindow}

                const first = async () =>{ws.send(JSON.stringify(await sendGet(url, sampleRate, intWindow)))};
                first()
                //send data immediately after setting up the connection so there is not a long delay in the data, the rest are handled by intervals
                sendAndUpdateInterval(ws, url, sampleRate, intWindow);
                break
        default:
            console.log('Unknown message type:', type);
        }});


    ws.on('close', () => {
        console.log('WebSocket disconnected (server)');
        clearInterval(ws.interval) // cancel sending interval updates when client disconnects
    });
});

const sendAndUpdateInterval = (ws) => {
    const {url, sampleRate, intWindow} = ws.intVals
    //updates the interval, needs separate function on reinits to build

    
    ws.interval = setInterval(async () => {
        ws.send(JSON.stringify(await sendGet(url, sampleRate, intWindow)));
        console.log('sending...', url, sampleRate, intWindow);
    }, sampleRate * 1000);
}



