const http = require("http");

const hostname = "127.0.0.1";
const port = 3000;

const express = require("express");
const app = express();

const dirname = "C:\\Users\\Andy\\Desktop\\Reddit Clone";

app.use(express.static("public"));

app.get('/', function(req, res) {
    res.sendFile('index.html', {root: dirname })
});

app.listen(port, function() {
    console.log("App listening on port 3000");
})