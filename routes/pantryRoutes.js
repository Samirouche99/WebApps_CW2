const express = require('express');
const router = express.Router();
const controller = require('../controllers/pantryController');
const { login, verify, verifyAdmin } = require('../auth/auth');

router.get('/login', controller.show_login);
router.post('/login', login, controller.handle_login);
router.get('/', controller.landing_page);  // Accessible without login
router.get('/search', controller.search_product);
router.get('/new', controller.show_new_entries);
router.post('/new', controller.post_new_entry);
router.get('/register', controller.show_register_page);
router.post('/register',  controller.post_new_user);
router.get("/loggedIn", verify, controller.loggedIn_landing);
router.get("/logout", controller.logout);
router.get('/about', controller.link_about);  // Assume public access
router.get('/contact', controller.link_contact);  // Assume public access
router.post('/contactPost', controller.contact_post);

// in your routes file, typically routes/pantryRoutes.js
router.get('/adminLogin', controller.show_admin_login);
router.post('/adminLogin', controller.adminLogin);
router.get('/adminDashboard', verifyAdmin, controller.adminDashboard);
router.post('/adminDeleteUser/:userId', verifyAdmin, controller.deleteUser);

router.get('/basket', controller.viewBasket);
router.post('/addToBasket', controller.add_to_basket);
router.post('/addToBasketInBasket', controller.add_to_basket_in_basket);

router.post('/removeFromBasket', controller.remove_From_Basket);
// Add to basket

// View basket
router.get('/viewBasket',verify, controller.viewBasket);
// In your app.js or wherever you set up routes
router.post('/checkoutBasket', controller.checkoutBasket);

// Remove from basket

router.post('/adminUpdate', verifyAdmin, controller.addItem);
router.post('/adminUpdate/:itemId', verifyAdmin, controller.updateItem);
router.post('/adminDelete/:itemId', verifyAdmin, controller.deleteItem);

router.use((req, res) => res.status(404).send('404 Not Found'));
router.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Internal Server Error');
});
module.exports = router;
