// Import required libraries and modules
const express = require('express');
const router = express.Router();
const controller = require('../controllers/pantryController');
const { login, verify, verifyAdmin } = require('../auth/auth');

// Public routes
router.get('/login', controller.show_login); // Show login page
router.post('/login', login, controller.handle_login); // Handle login form submission

router.get('/', controller.landing_page); // Landing page (accessible without login)
router.get('/search', controller.search_product); // Search for products
router.get('/new', controller.show_new_entries); // Show form for adding new entries
router.post('/new', controller.post_new_entry); // Handle adding new entries
router.get('/register', controller.show_register_page); // Show registration page
router.post('/register',  controller.post_new_user); // Handle user registration
router.get('/about', controller.link_about); // About page (assume public access)
router.get('/contact', controller.link_contact); // Contact page (assume public access)
router.post('/contactPost', controller.contact_post); // Handle contact form submission

// User routes
router.get("/loggedIn", verify, controller.landing_page); // Landing page for logged-in users
router.get("/logout", controller.logout); // Logout route

// Admin routes
router.get('/adminLogin', controller.show_admin_login); // Show admin login page
router.post('/adminLogin', controller.adminLogin); // Handle admin login form submission
router.get('/adminDashboard', verifyAdmin, controller.adminDashboard); // Admin dashboard
// admin operations on users
router.post('/adminDeleteUser/:userId', verifyAdmin, controller.deleteUser); // Delete user (admin only)
// admin operations on items
router.post('/adminUpdate', verifyAdmin, controller.addItem); // Add item (admin only)
router.post('/adminUpdate/:itemId', verifyAdmin, controller.updateItem); // Update item (admin only)
router.post('/adminDelete/:itemId', verifyAdmin, controller.deleteItem); // Delete item (admin only)

//basket routes
router.get('/basket', controller.viewBasket); // View basket
router.post('/addToBasket', verify, controller.add_to_basket); // Add item to basket
router.post('/addToBasketInBasket', controller.add_to_basket_in_basket); // Add item to basket from basket page
router.post('/removeFromBasket', controller.remove_From_Basket); // Remove item from basket
router.get('/viewBasket', controller.viewBasket); // View basket (logged in user only)
router.post('/checkoutBasket', controller.checkoutBasket); // Checkout basket



// error handling
router.use((req, res) => res.status(404).send('404 Not Found')); // 404 Not Found
router.use((err, req, res, next) => {
    console.error(err); // log error to console
    res.status(500).send('Internal Server Error'); // Internal server error
});

module.exports = router; // Export router
