var express = require('express');

var app = express.createServer(express.logger());

var msg = "Hello World 2+!";

var fs = require('fs');

var buffer = fs.readFileSync('index.html');

// now over-ride msg
msg = buffer.toString();  

app.get('/', function(request, response) {
  response.send(msg);
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
