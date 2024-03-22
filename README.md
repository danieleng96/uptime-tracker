Hrl uptime exercise:

Author: Daniel Eng
Date: 3/22/2024

Welcome to my Uptime monitor dashboard!


Goal: enter urls and ports to monitor websites that I do not have direct control of.

Approach:
Language: Javascript
Frontend: React.js
Plotting: D3, Plotly.js
Backend: Node/express.js, WebSocket library ws

I used a backend Express JS server to set up a websocket that the frontend would connect to as a client from each Url that the the user entered.
The backend would send a get request to the Url given and send back data, such as response time and error status.
On the frontend, the client would receive this data packet and add it to a data array object, which was maintained through React's useState.

There would be a unique data signature for bad errors and for paused metering,
that the plotting software would interpret and display accordingly.

dummyDowntimeServer.js can be initialized from command line and with:
    node dummyDowntimeServer 1234 0.75
    for a server running on http://localhost:1234 with uptime of 75%.

https commercial sites or localhosts with port specified all are handled, with extensions and further paths.

Stopping metering allows user to zoom or export data from a single plot.

Initialization with variable units to set unlimited (limited only by system resources) number of clients and with great time flexibility.


Thank you.
Daniel





