global.baseDir = __dirname;
const config = require(baseDir + '/config/config.json');
global.baseURL = config.baseURL;

const http = require("http");
const hostname = config.hostname;
const port = config.port;
const express = require("express");
const app = express();
const session = require("express-session");
const sqlStore = require("express-mysql-session")(session);
const runService = require(baseDir + "/utils/runService").runService;

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const credentials = require(baseDir + '/config/credentials.json');
const bodyParser = require("body-parser");

const options = {
    host: '127.0.0.1',
    port: 3306,
    user: credentials.user,
    password: credentials.password,
    database: credentials.db_name
}
const sessionStore = new sqlStore(options);


sessionStore.onReady().then(() => {
	// MySQL session store ready for use.
	console.log('MySQLStore ready');
}).catch(error => {
	// Something went wrong.
	console.error(error);
});

app.use(session({
    key: credentials.key,
    secret: credentials.secret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 2,
        sameSite: true
    }
}));


app.use(express.static("public"));
app.set('view engine', 'ejs');

const accountControlRoutes = require('./routes/accountControls/accountControlRoutes');
const subredditControlRoutes = require('./routes/subreddits/subredditRoutes');
app.use("/", accountControlRoutes);
app.use("/", subredditControlRoutes);


app.listen(port, function() {
    console.log("App listening on port 3000");
});


runService(baseDir + "/services/updateRankings", 1000 * 60 * 1);