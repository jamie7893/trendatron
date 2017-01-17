'use strict';

let server;

const express = require('express'),
    app = express(),
    path = require('path'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    config = require('./config.js'),
    Sequelize = require('sequelize'),
    uuid = require('uuid'),
    axios = require('axios'),
    cookieParser = require('cookie-parser'),
    sessionFileStore = require('session-file-store'),
    _ = require('lodash'),
    passport = require('passport'),
    TwitchTokenStrategy = require('passport-twitch-token'),
    // bot = require('./app.js'),
    session = require('express-session');

let FileStore = sessionFileStore(session);

// Cookies
app.set('trust proxy', 1); // trust first proxy
var sess = {
    genId: function(req) {
        return uuid.v4();
    },
    name: 'trendatron',
    secret: uuid.v4(),
    saveUnitialized: true,
    resave: true,
    store: new FileStore(),
    cookie: {
        secure: false
    },
    saveUninitialized: true
};

if (app.get('env') === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sess.cookie.secure = true; // serve secure cookies
}

app.use(morgan('dev')).use(express.static(path.join(__dirname, 'src'))).use(passport.initialize()).use(passport.session()).use(session(sess)).use(cookieParser()).use(bodyParser.json()).use(bodyParser.urlencoded({extended: true}));

module.exports.close = function() {
    console.log('shutting down the server...');
    server.close();
};

// sequelize initialization //
// for heroku
// const sequelize = new Sequelize('postgres://uzjeoebhaoxwuk:IVuScu6q96OjaUvc_fJBb8GVJl@ec2-54-163-254-231.compute-1.amazonaws.com:5432/denten10cruhtj');
// for local
const sequelize = new Sequelize('postgres://postgres:admin@localhost:3000/postgres');

let Viewer = sequelize.import ('./model/viewer.js'),
    Channel = sequelize.import ('./model/channel.js');

// io.on('connection', function(socket) {
//     console.log('a user connected');
//     socket.on('disconnect', function() {
//         console.log('a user disconnected');
//
//     });
//     var venue = {};
//     socket.on('venue', function(data) {
//         venue = data.venue;
//     });
//
// });

const userService = require("./service/user.js")(sequelize);

sequelize.sync().then(function(res) {
    Viewer.sync();
    Channel.sync();
    // passport.authenticate('twitch-token')
    app.get('/viewer', (req, res) => {
        res.send(req.session.viewer);
    });

    app.route('/viewer').get(userService.getUser);
    app.route('/auth/twitch').get(userService.login);

    server = http.listen(process.env.PORT || 1738, process.env.IP || "0.0.0.0", function() {
        let addr = server.address();
        console.log("Server listening at", addr.address + ":" + addr.port);

    });
}).catch(function(e) {
    console.log('Error in sequelize.sync(): ' + e);
});