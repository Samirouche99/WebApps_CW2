const Datastore = require("gray-nedb");
const bcrypt = require('bcrypt'); 
const saltRounds = 10;

class User {
    constructor(username, password, isAdmin = false) {
        this.username = username;
        this.password = password;
        this.isAdmin = isAdmin;
    }
}

class UserDAO {
    static instance;

    constructor(dbFilePath) {
        if (UserDAO.instance) {
            return UserDAO.instance;
        }
        this.db = new Datastore({ filename: dbFilePath, autoload: true });
        UserDAO.instance = this;
    }

    init() {
        const defaultUsers = [
            { username: 'Peter', password: '12345678' },
            { username: 'Ann', password: 'password' },
            { username: 'admin', password: 'adminPassword', isAdmin: true }
        ];

        defaultUsers.forEach(user => {
            this.lookup(user.username, (err, existingUser) => {
                if (!existingUser) {
                    this.create(user.username, user.password, user.isAdmin);
                }
            });
        });
    }

    create(username, password, isAdmin = false) {
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                console.error(`Error hashing password for user: ${username}`, err);
                return;
            }
            let entry = { username, password: hash, isAdmin };
            this.db.insert(entry, (err) => {
                if (err) {
                    console.log(`Can't insert user: ${username}`);
                } else {
                    console.log(`User added: ${username}`);
                }
            });
        });
    }
    
    lookup(username, cb) {
        this.db.find({ 'username': username }, function (err, entries) {
            if (err || entries.length === 0) {
                return cb(null, null); // No error but user not found
            } else {
                return cb(null, entries[0]); // User found
            }
        });
    }

    getAllUsers(cb) {
        this.db.find({}, (err, docs) => {
            if (err) {
                cb(err, null);
            } else {
                cb(null, docs);
            }
        });
    }

    deleteUser(userId, cb) {
        this.db.remove({ _id: userId }, {}, (err, numRemoved) => {
            if (err) cb(err);
            else cb(null, numRemoved > 0);
        });
    }
}

const dao = new UserDAO('path/to/users.db');  // Ensure path is correctly set
dao.init();

module.exports = dao;
