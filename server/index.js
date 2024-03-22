// const express = require('express');
// const app = express();

// const port = 8080




const express = require('express');
const cors = require('cors');
const axios = require('axios');
const ws = require('ws')



const app = express();
const port = 5000;
// const PORT = process.env.PORT || 3001;
const httpServer = app.listen(port)
// const wss = new ws.Server({ noServer : true })

const wss = new ws.Server({ noServer : true })
//noServer = true because I will upgrade the http server. might not be necessary

httpServer.on('upgrade', (req,socket, head) => {

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
    })
})

app.use(express.json());
app.use(cors()); // Use cors middleware

const sendGet = async (url, sampleRate, intWindow) => {
                            try {
                            const t0 = Date.now();
                            const resp = await axios.get(url);
                            const latency = Date.now()-t0;
    //needs to be reworked
                            return ({type: 'stream', url: url, status: resp.status ,latency: latency, sampleRate: sampleRate, intWindow:intWindow, tf:t0+latency})}
                            catch (e) {
                                return ({type: 'stream', url: url, status: e.status, latency: 0, sampleRate: sampleRate, intWindow: intWindow, tf:Date.now()})
                            }
                }

const toggleSingle = (on, client) => {
    //disable connection for both
    //if on should reconnect
    //each toggle on or off
    if (client.intVals)
    // if (on) {
    // clearInterval(cli.interval);}3
    // else
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
    console.log('connected to client');

    ws.on('message', (packet) => {
        const message = JSON.parse(packet.toString());
        console.log(message)
        // const { type, body } = message;
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
                            if (client !== ws && client.id === body.u) {   
                                toggleSingle(body.on, client)}
                                //disable connection for both
                                //if on should reconnect
                                // Terminate connection
                    })}
                }
                break;

            
            // case 'meteringOn':
            //     //needs to have initInterval run first to set interval as variable in ws
            //     wss.clients.forEach(client => {
            //         //want to pause interval, save and be able to reactivate.
                
            //         console.log('turning on all connections');
            //         setInterval(client.interval); // Clear the interval fromprevious client
            //          // Terminate connection
            //     })

            // case 'metering':
            //         // Reactivate interval for all clients
            //         if (wss.clients) {
            //         wss.clients.forEach(client => {
            //             toggleSingle(true, client)
            //         });}
            //         break
            case 'delete':
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
                //send data immediately after setting up the connection, the rest are handled by intervals
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
    // ws.intervalFunc = async () => {
    //     ws.send(JSON.stringify(await sendGet(url, sampleRate, intWindow)));
    //     console.log('sending...', url);
    
    ws.interval = setInterval(async () => {
        ws.send(JSON.stringify(await sendGet(url, sampleRate, intWindow)));
        console.log('sending...', url, sampleRate, intWindow);
    }, sampleRate * 1000);
}



