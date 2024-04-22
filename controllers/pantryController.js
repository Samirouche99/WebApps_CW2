//import libraries and modules
const Pantry = require("../models/pantryModel");
const userDao = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const db = new Pantry();

//initialize insance of pantry 
db.init();

//render home page
exports.landing_page = function (req, res) {
  db.getAllEntries()
  .then((list) => {
      res.render("landingPage", {
          Pantry: list,
          user: res.locals.user 
      });
  })
  .catch((err) => {
      console.log("Error retrieving data", err);
      res.status(500).send("Internal Server Error");
  });
};

//render login page
exports.show_login = function (req, res) {
  res.render("user/login");
};

//login post user and verify
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

//logout function clears basket and populates pantry with items
exports.logout = function (req, res) {
  // Clear the JWT token cookie
  res.clearCookie("jwt");
  if (req.session && req.session.basket && req.session.basket.items.length > 0) {
      req.session.basket.clearBasket(db);
      req.session.basket = null; // Clear the basket
      req.user = null; // Unset the user
      req.session.save(err => {
          if (err) {
              console.error("Failed to save session:", err);
              return res.status(500).send("Failed to update session.");
          }
          res.status(200).redirect("/");
      });
  } else {
      req.user = null;
      if (req.session) {
          req.session.basket = null; 
      }
      res.status(200).redirect("/");
  }
};

//render register page
exports.show_register_page = function (req, res) {
  res.render("user/register");
};

//post new user and render login page if doesnt exist
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

//search product return results
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

//show add item page
exports.show_new_entries = function (req, res) {
  const user = req.user;
  const today = new Date().toISOString().split('T')[0];
  res.render("addItem", {
    title: "Food Sharing App - Add Item",
    user: user, 
    today:today
  });
};

//add new item post 
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

//render about page 
exports.link_about = function (req, res) {
  res.render("about", {
    title: "Food Sharing App - About",
    user: res.locals.user  
  });
};

//render contact us page
exports.link_contact = function (req, res) {
  res.render("contact", {
    title: "Food Sharing App - Contact Us",
    user: res.locals.user  
  });
};

//contact us post method
exports.contact_post = function(req, res) {
  const { name, message } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('contact', { errors: errors.array(), user: req.user });
  } else {
    res.render('thankyou', { user: req.user });
  }
};

//add item to basket
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


//add extra item already in basket
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

//render basket page
exports.viewBasket = function(req, res) {
  if (!req.session.basket || req.session.basket.items.length === 0) {
      return res.render('basket', { user: res.locals.user, items: [] });
  }
  let basketItems = req.session.basket.getBasketItems();
  let ids = basketItems.map(item => item._id); 
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

//remove item from basket
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


//checkout basket removing items from pantry
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
                  if (newQuantity > -1) {
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


//regsiter admin... not implemented admin register due to security concerns
exports.registerAdmin = function(req, res) {
  const { username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10); 
  const newUser = new User(username, hashedPassword, true); 
  db.users.insert(newUser, function(err, user) {
      if (err) {
          res.status(500).send("Failed to create admin user");
      } else {
          res.send("Admin user created successfully");
      }
  });
};

//show admin login page
exports.show_admin_login = function(req, res){
  res.render("user/adminLogin")
}


//post admin login details 
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


//render admin dashboard
exports.adminDashboard = function(req, res) {
  const today = new Date().toISOString().split('T')[0];
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
      db.getAllEntries() 
  ])
  .then(results => {
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

//function to delete user 
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
  const itemId = req.params.itemId; 
  db.deleteEntry(itemId)
      .then(() => res.redirect('/adminDashboard')) 
      .catch(err => {
          console.error("Error deleting item: ", err);
          res.status(500).send("Error deleting item");
      });
};
