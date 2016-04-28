// Run the web application in node

var express = require('express');
var morgan = require('morgan');

app = express();

// Log interactions with server
app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400
}));

// Serve out pages starting from html/index.html
app.use(express.static(__dirname + '/dist'));
app.use('/d3', express.static(__dirname + '/node_modules/d3'));
app.use('/Cesium', express.static(__dirname + '/ThirdParty/Cesium/Build/Cesium'));
app.use('/iconfont', express.static(__dirname + '/ThirdParty/material-iconfont'));

// Start server
const port = 8080;
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
