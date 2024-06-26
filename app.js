const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const path = require('path');
//const session = require('express-session');

const app = express();
require('dotenv').config();

// Pass basketDb to routes or controllers that need it

/*
// Session configuration
app.use(session({
    secret: 'your_secret_key',  
    resave: false,
    saveUninitialized: true,  
    cookie: { secure: process.env.NODE_ENV === 'production' }  // Secure cookies require an HTTPS environment
}));
*/
// Middleware for parsing request bodies and cookies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


app.use((req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (!err) {
                req.user = decoded;  // Attaches user info to the request
                res.locals.user = decoded;  // Makes user data available in views
                res.locals.isAdmin = decoded.isAdmin;  // Make admin status available in views
            }
            next();
        });
    } else {
        next();
    }
});
/*
// Middleware to decode JWT and set user information
app.use((req, res, next) => {
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (!err) {
                req.user = decoded;
                res.locals.user = decoded;  // Makes user data available in views
            }
            next();
        });
    } else {
        next();
    }
});

// Middleware to manage the shopping basket in the user's session
app.use((req, res, next) => {
    if (req.session.basket && typeof req.session.basket === 'object' && !req.session.basket.addToBasket) {
        // Convert plain object back to Basket instance
        const tempBasket = new Basket();
        tempBasket.items = req.session.basket.items || [];
        req.session.basket = tempBasket;
    } else if (!req.session.basket) {
        console.log("Initializing new basket");
        req.session.basket = new Basket();
    }
    next();
});


app.use((req, res, next) => {
    console.log("Current Basket:", req.session.basket instanceof Basket ? "Basket Instance" : "Not a Basket Instance");
    next();
});
*/

// Serve static files and set up view engine
app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, '/node_modules/bootstrap/dist/css')));
app.set('view engine', 'mustache');
app.engine('mustache', require('mustache-express')());

// Include and use routes from pantryRoutes
const pantryRoutes = require('./routes/pantryRoutes');
app.use('/', pantryRoutes);


// Start the server
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}. Ctrl+C to quit.`);
});

// Error handling
server.on('error', (err) => {
    console.error('Server error:', err.message);
});

module.exports = app;
