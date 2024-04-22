// Import required libraries and modules
const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

// Login verification middleware
exports.login = function (req, res, next) {
    // Extract username and password from request body
    let username = req.body.username;
    let password = req.body.password;

    // Look up user in the database
    userModel.lookup(username, function (err, user) {
        if (err) {
            console.log("Error looking up user", err);
            return res.status(500).send(); // Internal server error
        }
        if (!user) {
            console.log("User not found", username);
            // Render login page with error message
            return res.status(401).render("user/login",{ error: "Username or password incorrect" });
        }
        // Compare password hash with provided password
        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {
                // If password matches, generate JWT token
                let accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '1h' // Token expiration time
                });

                // Set JWT token as a cookie (secure and HTTPOnly)
                res.cookie("jwt", accessToken, { httpOnly: true, secure: true });
                next(); // Proceed to the next middleware or route
            } else {
                // If password does not match, render login page with error message
                return res.status(401).render("user/login", { error: "Invalid credentials" });
            }
        });
    });
};

// Verify JWT token middleware
exports.verify = function (req, res, next) {
    // Get JWT token from cookies
    let token = req.cookies.jwt;
    if (!token) {
        // If no token found, redirect to login page
        console.log("No token found. Redirecting to login.");
        return res.status(403).redirect('/login');
    }

    // Verify JWT token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            // If token verification fails, clear the token and redirect to login page
            console.log("JWT verification failed:", err);
            res.clearCookie("jwt");
            return res.status(401).redirect('/login');
        }
        req.user = decoded; // Set decoded user information in request object
        next(); // Proceed to the next middleware or route
    });
};

// Check if user is an admin middleware
exports.isAdmin = function(req, res, next) {
    if (req.user && req.user.isAdmin) {
        // If user is an admin, proceed to the next middleware or route
        next();
    } else {
        // If user is not an admin, render an error page
        return res.status(401).render("user/adminLogin",{ error: "Username or password incorrect" });

    }
}

// Verify if user is an admin middleware
exports.verifyAdmin = function(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) {
        // If no token found, redirect to admin login page
        return res.redirect('/admin/login');
    }
    // Verify JWT token and check if user is an admin
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err || !decoded.isAdmin) {
            // If token verification fails or user is not an admin, clear the token and redirect to admin login page
            res.clearCookie("jwt");
            return res.status(401).redirect('/admin/login');
        }
        req.user = decoded; // Set decoded user information in request object
        next(); // Proceed to the next middleware or route
    });
}
