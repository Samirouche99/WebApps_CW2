const nedb = require('nedb');

class Basket {
    constructor(dbFilePath) {
        if (dbFilePath) {
            this.db = new nedb({ filename: dbFilePath, autoload: true });
            console.log('Basket DB connected to ' + dbFilePath);
        } else {
            this.db = new nedb();
        }
    }

    init() {
    }
    addToBasket(userId, item, quantity, pantryDb) {
        return new Promise((resolve, reject) => {
            this.db.update(
                { userId: userId, _id: item._id },
                { $inc: { quantity: quantity }, $set: { name: item.name } },
                { upsert: true },
                (err) => {
                    if (err) {
                        console.error('Error adding item to basket:', err);
                        reject(err);
                    } else {
                        pantryDb.decreaseItemQuantity(item._id, quantity).then(() => {
                            console.log(`Item ${item._id} added/updated in basket for user ${userId}`);
                            resolve();
                        }).catch(err => reject(err));
                    }
                }
            );
        });
    }

    removeFromBasket(userId, itemId, quantity, pantryDb) {
        return new Promise((resolve, reject) => {
            this.db.findOne({ userId: userId, _id: itemId }, (err, item) => {
                if (err) {
                    console.error('Error finding item in basket:', err);
                    reject(err);
                } else if (item && item.quantity > quantity) {
                    this.db.update({ userId: userId, _id: itemId }, { $inc: { quantity: -quantity } }, {}, (err) => {
                        if (err) {
                            console.error('Error decreasing item quantity:', err);
                            reject(err);
                        } else {
                            pantryDb.increaseItemQuantity(itemId, quantity).then(() => resolve()).catch(err => reject(err));
                        }
                    });
                } else {
                    this.db.remove({ userId: userId, _id: itemId }, {}, (err) => {
                        if (err) {
                            console.error('Error removing item from basket:', err);
                            reject(err);
                        } else {
                            pantryDb.increaseItemQuantity(itemId, item.quantity).then(() => resolve()).catch(err => reject(err));
                        }
                    });
                }
            });
        });
    }


    // Clear the basket
    clearBasket(userId) {
        return new Promise((resolve, reject) => {
            this.db.remove({ userId: userId }, { multi: true }, (err, numRemoved) => {
                if (err) {
                    console.error('Error clearing basket:', err);
                    reject(err);
                } else {
                    console.log(`Basket cleared for user ${userId}, ${numRemoved} items removed.`);
                    resolve();
                }
            });
        });
    }

    // Get the items in the basket
    getBasketItems(userId) {
        return new Promise((resolve, reject) => {
            this.db.find({ userId: userId }, (err, items) => {
                if (err) {
                    console.error('Error retrieving basket items:', err);
                    reject(err);
                } else {
                    resolve(items);
                }
            });
        });
    }
}

module.exports = Basket;
