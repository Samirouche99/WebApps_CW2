const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

exports.login = function (req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    userModel.lookup(username, function (err, user) {
        if (err) {
            console.log("Error looking up user", err);
            return res.status(500).send();
        }
        if (!user) {
            console.log("User not found", username);
            return res.status(401).render("user/login",{ error: "Username or password incorrect" });

        }

        bcrypt.compare(password, user.password, function (err, result) {
            if (result) {
                let accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '1h'
                });

                // Set cookie securely with HTTPOnly and Secure flag (ensure your site is served over HTTPS)
                res.cookie("jwt", accessToken, { httpOnly: true, secure: true });
                next();
            } else {
                return res.status(401).render("user/login", { error: "Invalid credentials" });
            }
        });
    });
};

exports.verify = function (req, res, next) {
    let token = req.cookies.jwt;
    if (!token) {
        console.log("No token found. Redirecting to login.");
        return res.status(403).redirect('/login');
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT verification failed:", err);
            res.clearCookie("jwt");
            return res.status(401).redirect('/login');
        }
        req.user = decoded;  // Assuming the decoded token directly contains the user information
        next();
    });
};

// Add this in your user management controller
exports.registerAdmin = function(req, res) {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10); // Ensure you hash the password

    const newUser = new User(username, hashedPassword, true); // Set isAdmin to true

    // Save the admin user to the database
    db.users.insert(newUser, function(err, user) {
        if (err) {
            res.status(500).send("Failed to create admin user");
        } else {
            res.send("Admin user created successfully");
        }
    });
};



exports.isAdmin = function(req, res, next) {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        return res.render('/admin/login', {error: "Error"});

    }
}

exports.verifyAdmin = function(req, res, next) {
    const token = req.cookies.jwt;
    if (!token) {
        return res.redirect('/admin/login');
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err || !decoded.isAdmin) {
            res.clearCookie("jwt");
            return res.status(401).redirect('/admin/login');
        }
        req.user = decoded;
        next();
    });
}
