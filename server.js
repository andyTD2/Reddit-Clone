baseDir = __dirname;

const http = require("http");
const hostname = "127.0.0.1";
const port = 3000;
const express = require("express");
const app = express();
const session = require("express-session");
const sqlStore = require("express-mysql-session")(session);

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const config = require(baseDir + '/config/credentials.json');
const bodyParser = require("body-parser");

const options = {
    host: '127.0.0.1',
    port: 3306,
    user: config.user,
    password: config.password,
    database: config.db_name
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
    key: config.key,
    secret: config.secret,
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

app.get('/', function(req, res) {
    params = {subreddit: {name: ""}};

    if(req.session.loggedIn)
    {
        params.username = req.session.user;
    }

    res.render("index", params);
});

const accountControlRoutes = require('./routes/accountControls/accountControlRoutes');
const subredditControlRoutes = require('./routes/subreddits/subbredditControls');
app.use("/", accountControlRoutes);
app.use("/", subredditControlRoutes);


app.listen(port, function() {
    console.log("App listening on port 3000");
});