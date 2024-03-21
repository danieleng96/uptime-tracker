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
//noServer = true because I will upgrade the http server

httpServer.on('upgrade', (req,socket, head) => {

    wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req)
    })
})


app.use(express.json());
app.use(cors()); // Use cors middleware

wss.on('connection', (ws) => {
    console.log('connected to client')

ws.on('message', (packet) => {
    // wss.clients.forEach((client) => {
    //     // console.log("client", client)
    //     if (client.readyState = ws.OPEN) {
            
            const u = JSON.parse(packet.toString())[0]
            const sampleRate = JSON.parse(packet.toString())[1]
            const intWindow = JSON.parse(packet.toString())[2]

            console.log(u, sampleRate, intWindow)

            sendGet = async (url)  => {
                        try {
                        const t0 = Date.now();
                        const resp = await axios.get(url);
                        const latency = Date.now()-t0;

                        return ({url: url, status: resp.status ,latency: latency, sampleRate: sampleRate, intWindow:intWindow})}
                        catch (e) {
                            return ({url: url, status: e.status, latency: 0, sampleRate: sampleRate, intWindow: intWindow})
                        }
            }

            const interval = setInterval(async () => {
                const data = await sendGet(u)
                ws.send(JSON.stringify(data));
                console.log('sending...', data)
            }, (parseInt(sampleRate)*1000));
        }
    


)


ws.on('close', () => {
    console.log('WebSocket disconnected (server)');
    clearInterval(interval); // Stop sending updates when client disconnects
});
}
);


app.post('/get-status', async (req, res) => {
    const {url, sampleRate} = req.body;

    //extract urls and sample rate for each
    //will set each url to run separately
    // const {urls, sampleRate} = req.body;

    // const urlArr = urls.split(',');

    try {

    //parent function to initialize stream of the sendGet functions

    


    sendGet = async (url)  => {
        //actual sending of request to desired website.
            // if (!urls.length) return;
                // const url = urls.shift();
                const t0 = Date.now();
                const resp = await axios.get(url);
                const latency = Date.now()-t0;

                // const data = await resp.json();
                // console.log('resp ', url, ':', data);
                return (latency)
                // setTimeout(() => sendGet(url, sampleRate*1000), sampleRate*1000);
    }

    // wss.on('connection',  (ws) => {
    //     console.log('connected to client')
    
    // const interval = setInterval(async (url, sampleRate) => {
    //     const data = await sendGet(url)
    //     // console.log('returning: ' , data))
    //     ws.send(JSON.stringify(data));
    //     // const data = [{a:'a'}]
    //     // ws.send(data);
    //     console.log('sending...')
    // }, sampleRate);
    
    // ws.on('close', () => {
    //     console.log('WebSocket disconnected');
    //     clearInterval(interval); // Stop sending updates when client disconnects
    // });
    // }
    // );

    

        // const response = await axios.get(url);
        const response = await sendGet(url, sampleRate);
        // ws.emit(JSON.stringify(response.head));

        res.status(200).send({ status: `initializing ${response}` });
        } catch (error) {
        res.status(500).send({ status: 'down', error: error.message });
        }
  });



// app.get('/check-website-status', async (req, res) => {
//   try {
//     const response = await axios.head('https://www.youtube.com');
//     res.status(201).send({ status: response.status });
//   } catch (error) {
//     res.status(500).send({ status: 'down', error: error.message });
//   }
// });

