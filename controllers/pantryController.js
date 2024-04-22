const Pantry = require("../models/pantryModel");

const userDao = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

const db = new Pantry();
db.init();






exports.landing_page = function (req, res) {
  db.getAllEntries()
  .then((list) => {
      res.render("landingPage", {
          Pantry: list,
          title: "Food Sharing App - Home Page",
          user: res.locals.user  // Make sure 'user' is consistently used
          
      });
  })
  .catch((err) => {
      console.log("Error retrieving data", err);
      res.status(500).send("Internal Server Error");
  });
};



exports.show_login = function (req, res) {
  res.render("user/login");
};


exports.handle_login = function (req, res) {
  const { username, password } = req.body;
  userDao.lookup(username, function (err, user) {
      if (err || !user) {
          return res.render("user/login", { error: "Invalid credentials" });
      }
      bcrypt.compare(password, user.password, function (err, result) {
          if (result) {
              const accessToken = jwt.sign({ username: user.username, userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
                  expiresIn: "1h"
              });

              // Initialize or retrieve the basket for the session
              if (!req.session.basket) {
                  console.log("Initializing new basket for the user");
                  req.session.basket = new Basket();  // This creates a new basket for the user
              }

              res.cookie("jwt", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
              res.redirect("/loggedIn");
          } else {
              res.render("user/login", { error: "Invalid credentials" });
          }
      });
  });
};



exports.loggedIn_landing = function (req, res) {
  const user = req.user;
  db.getAllEntries().then((list) => {
    res.render("landingPage", {
      Pantry: list,
      title: "Food Sharing App - Home Page",
      user: user // Pass the user variable directly
    });
  }).catch((err) => {
    res.redirect("/login");
  });
};


exports.logout = function (req, res) {
  // Clear the JWT token cookie
  res.clearCookie("jwt");

  // Unset the user and clear the basket in the session
  req.user = null;
  if (req.session) {
    req.session.basket = null; // Clear the basket on logout
    req.session.save(err => {
      if (err) {
        console.error("Failed to save session:", err);
      }
      res.status(200).redirect("/");
    });
  } else {
    res.status(200).redirect("/");
  }
};


exports.show_register_page = function (req, res) {
  res.render("user/register");
};

exports.post_new_user = function (req, res) {
  const user = req.body.username;
  const password = req.body.pass;


  userDao.lookup(user, function (err, u) {
    if (u) {
      res.render("user/register", { error: "Username already taken" });
      return;
    }
    userDao.create(user, password);
    console.log("register user", user, "password", password);
    res.redirect("/login");
  });
};



exports.search_product = function (req, res) {
  const query = req.query.q; // Get the search query from request parameters
  db.searchProduct(query)
    .then((results) => {
      res.render("result", { Results: results }); // Render the search results using the results view
    })
    .catch((err) => {
      console.log("Search failed", err);
      res.status(500).send("Internal Server Error");
    });
};

exports.search_product_post = function (req, res) {
  const query = req.body.q; // Get the search query from request body
  db.searchProduct(query)
    .then((results) => {
      res.render("results", { Results: results }); // Render the search results using the results view
    })
    .catch((err) => {
      console.log("Search failed", err);
      res.status(500).send("Internal Server Error");
    });
};

exports.show_new_entries = function (req, res) {
  const user = req.user;
  const today = new Date().toISOString().split('T')[0];

  res.render("addItem", {
    title: "Food Sharing App - Add Item",
    user: user, // Pass the user variable directly
    today:today
  });
};


exports.post_new_entry = function (req, res) {
  console.log("processing post-new_entry controller");
  const { name, expDate, quantity } = req.body;

  if (!name) {
    res.status(400).send("Entries must have a name.");
    return;
  }
  const expirationDate = new Date(expDate).toISOString().split('T')[0];

  

  db.addEntry(name, expDate, quantity)
    .then(() => res.redirect("/loggedIn"))
    .catch(err => {
      console.error("Error adding item:", err);
      res.status(500).send("Error processing request");
    });
};


exports.link_about = function (req, res) {
  res.render("about", {
    title: "Food Sharing App - About",
    user: res.locals.user  
  });
};

exports.link_contact = function (req, res) {
  res.render("contact", {
    title: "Food Sharing App - Contact Us",
    user: res.locals.user  
  });
};


exports.contact_post = function(req, res) {
  // Extract the validated fields and errors from the request
  const { name, message } = req.body;
  const errors = validationResult(req);

  // Check if there are any validation errors
  if (!errors.isEmpty()) {
    // If there are validation errors, render the form again with error messages
    return res.status(400).render('contact', { errors: errors.array(), user: req.user });
  } else {
    // If validation passes, process the form data and render the thank you page
    // Do something with the name and message, e.g., save to database
    res.render('thankyou', { user: req.user });
  }
};



exports.add_to_basket = function(req, res) {
  if (!req.session.basket) {
    req.session.basket = new Basket();
}

    const { itemId, quantity } = req.body;
    db.findItemById(itemId).then(item => {
        if (!item || item.quantity < quantity) {
            return res.status(404).send('Not enough stock or item not found');
        }
        req.session.basket.addToBasket(item, parseInt(quantity), db);
        res.redirect('/');
    }).catch(err => {
        console.error('Error adding item to basket:', err);
        res.status(500).send("Error processing request");
    });
};

exports.removeFromBasket = function(req, res) {
    const { itemId, quantity } = req.body;
    req.session.basket.removeFromBasket(itemId, parseInt(quantity), db);
    res.redirect('/basket');
};


exports.add_to_basket_in_basket = function(req, res) {
  const { itemId, quantity } = req.body;
  db.findItemById(itemId).then(item => {
      if (!item || item.quantity < quantity) {
          return res.status(404).send('Not enough stock or item not found');
      }
      req.session.basket.addToBasket(item, parseInt(quantity), db);
      res.redirect('/basket');
  }).catch(err => {
      console.error('Error adding item to basket:', err);
      res.status(500).send("Error processing request");
  });
};


exports.viewBasket = function(req, res) {
  if (!req.session.basket || req.session.basket.items.length === 0) {
      return res.render('basket', { user: res.locals.user, items: [] });
  }
  let basketItems = req.session.basket.getBasketItems();
  let ids = basketItems.map(item => item._id); // Assuming each item has an _id

  // Assuming db.findItemsById can handle an array of ids correctly
  db.findItemsById(ids)
      .then(items => {
          let itemDetails = items.map(dbItem => {
              let basketItem = basketItems.find(b => b._id === dbItem._id);
              return {
                  _id: dbItem._id,
                  name: dbItem.name,
                  quantity: basketItem ? basketItem.quantity : 0
              };
          });
          res.render('basket', { user: res.locals.user, items: itemDetails });
      })
      .catch(err => {
          console.error("Error retrieving items from database: ", err);
          res.status(500).send("Error retrieving basket items.");
      });
};


exports.remove_From_Basket = function(req, res) {
  console.log("Attempting to remove from basket", req.body);
  const { itemId, quantity } = req.body;

  if (req.session.basket) {
      console.log("Basket found in session, proceeding to remove item.");
      req.session.basket.removeFromBasket(itemId, parseInt(quantity), db);
      res.redirect('/basket');
  } else {
      console.error("No basket found in session when trying to remove item.");
      res.status(500).send("No basket found in session.");
  }
};

exports.checkoutBasket = function(req, res) {
  if (!req.session.basket) {
      return res.status(400).send("No basket to checkout.");
  }
  
  Promise.all(req.session.basket.items.map(item => {
      return new Promise((resolve, reject) => {
          db.findItemById(item._id).then(pantryItem => {
              if (!pantryItem) {
                  reject(new Error("Item not found in pantry."));
              } else {
                  let newQuantity = pantryItem.quantity - item.quantity;
                  if (newQuantity > 0) {
                      db.updateEntry(item._id, pantryItem.name, pantryItem.expDate, newQuantity)
                          .then(() => resolve())
                          .catch(err => reject(err));
                  } else {
                      db.deleteEntry(item._id)
                          .then(() => resolve())
                          .catch(err => reject(err));
                  }
              }
          }).catch(err => reject(err));
      });
  }))
  .then(() => {
      req.session.basket.clearBasket(db);  // Clear the basket after checkout and pass 'db'
      res.redirect('/');  // Redirect to a thank you page or back to the main page
  })
  .catch(err => {
      console.error("Failed to checkout:", err);
      res.status(500).send("Error during checkout.");
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
exports.show_admin_login = function(req, res){
  res.render("user/adminLogin")
}

exports.adminLogin = function(req, res) {
  const { username, password } = req.body;
  userDao.lookup(username, function(err, user) {
      if (err) {
          return res.render('adminLogin', { error: "Server error" });
      }
      if (!user || !user.isAdmin) {
          return res.render('adminLogin', { error: "Invalid admin credentials"});
      }
      bcrypt.compare(password, user.password, function(err, result) {
          if (result) {
              const accessToken = jwt.sign({ username: user.username, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN_SECRET, {
                  expiresIn: "1h"
              });
              res.cookie("jwt", accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
              res.redirect("/");
          } else {
              return res.render('adminLogin', { error: "Invalid credentials"});
          }
      });
  });
};


// controllers/pantryController.js
exports.adminDashboard = function(req, res) {
  const today = new Date().toISOString().split('T')[0];

  // Fetching users and pantry entries simultaneously
  Promise.all([
      new Promise((resolve, reject) => {
          userDao.getAllUsers((err, users) => {
              if (err) {
                  reject(new Error("Error fetching users"));
              } else {
                  resolve(users);
              }
          });
      }),
      db.getAllEntries() // This already returns a promise
  ])
  .then(results => {
      // results[0] contains users, results[1] contains pantry entries
      res.render('adminDashboard', {
          title: 'Admin Dashboard',
          users: results[0],
          Pantry: results[1],
          today: today
      });
  })
  .catch(err => {
      console.error("Error retrieving data:", err);
      res.status(500).send("Internal Server Error");
  });
};

exports.deleteUser = function(req, res) {
  const userId = req.params.userId;
  userDao.deleteUser(userId, (err) => {
      if (err) {
          res.status(500).send("Error deleting user");
      } else {
          res.redirect('/adminDashboard');
      }
  });
};

// Function to add an item
exports.addItem = function(req, res) {
  const { name, expDate, quantity } = req.body;
  db.addEntry(name, expDate, quantity)
      .then(() => res.redirect('/adminDashboard'))
      .catch(err => res.status(500).send("Error adding item: " + err));
};

// Function to update an item
exports.updateItem = function(req, res) {
  const { itemId } = req.params;
  const { name, expDate, quantity } = req.body;
  db.updateEntry(itemId, name, expDate, quantity)
      .then(() => res.redirect('/adminDashboard'))
      .catch(err => res.status(500).send("Error updating item: " + err));
};

// Function to delete an item
exports.deleteItem = function(req, res) {
  const itemId = req.params.itemId; // Make sure the parameter name matches the route
  db.deleteEntry(itemId)
      .then(() => res.redirect('/adminDashboard')) // Redirect after successful deletion
      .catch(err => {
          console.error("Error deleting item: ", err);
          res.status(500).send("Error deleting item");
      });
};
