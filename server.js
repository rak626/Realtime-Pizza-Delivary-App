if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const app = express();
const ejs = require('ejs');
const expressLayout = require('express-ejs-layouts');
const path = require('path');

const PORT = process.env.PORT || 4400;
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const MongoDbStore = require('connect-mongo');

const passport = require('passport');
const Emitter = require('events');

//DB connection

const url = process.env.MONGO_CONNECTION_URL
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
// .then(() => {console.log("DataBase connection successful")},err => {
//   console.log("Database connection failed")
//   console.log(err)});

const connection = mongoose.connection;
connection
    .on('error', (err) => {
        console.log('Database connection error');
    })
    .on('close', () => {
        console.log('Database connection closed.');
    })
    .once('open', () => {
        console.log('Database Connected');
    });

//session store
// let mongoStore = new MongoDbStore({
//   mongooseConnection: connection,
//   collection: "sessions",
// });

//Event emitter

const eventEmitter = new Emitter();
app.set('eventEmitter', eventEmitter);

//session config

app.use(
    session({
        secret: process.env.COOKIE_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoDbStore.create({
            mongoUrl: process.env.MONGO_CONNECTION_URL,
            autoRemove: 'native',
        }),
        cookie: {maxAge: 1000 * 60 * 24 * 60},
    })
);

//passport config

app.use(passport.initialize());
app.use(passport.session());
const passportInit = require('./app/config/passport');
passportInit(passport);

app.use(flash());

//Global Middleware
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
});

// Assets
app.use(express.static(path.join(__dirname, '/public')));

//different data for express
app.use(express.json());
app.use(express.urlencoded({extended: false}));

//set Template engine

app.use(expressLayout);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');

//routes

require('./routes/web')(app);

app.use((req, res) => {
    res.status(404).send('<h1> 404, Page Not Found </h>');
});

const server = app.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
});

//Socket

const io = require('socket.io')(server);

io.on('connection', (socket) => {
    //Join
    socket.on('join', (orderId) => {
        socket.join(orderId);
    });
});

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data);
});

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data);
});
