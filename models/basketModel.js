class Basket {
    constructor() {
        this.items = [];
    }

    // Method to add an item to the basket
    addToBasket(item, quantity, pantry) {
        const index = this.items.findIndex(i => i._id === item._id);
        if (index > -1) {
            this.items[index].quantity += quantity;
        } else {
            this.items.push({
                _id: item._id,
                name: item.name,
                quantity: quantity
            });
        }
        // Decrease the quantity in the pantry
        pantry.decreaseItemQuantity(item._id, quantity);
    }

    // Method to remove an item from the basket
    removeFromBasket(itemId, quantity, pantry) {
        const index = this.items.findIndex(i => i._id === itemId);
        if (index > -1) {
            this.items[index].quantity -= quantity;
            if (this.items[index].quantity <= 0) {
                this.items.splice(index, 1);
            }
            // Restore the quantity in the pantry
            pantry.increaseItemQuantity(itemId, quantity);
        }
    }

    // Method to checkout items from the basket
    checkOutBasket(itemId, quantity, pantry) {
        const index = this.items.findIndex(i => i._id === itemId);
        if (index > -1) {
            this.items[index].quantity -= quantity;
            if (this.items[index].quantity <= 0) {
                this.items.splice(index, 1);
            }
            // Restore the quantity in the pantry
            pantry.decreaseItemQuantity(itemId, quantity);
        }
    }

    // Method to clear the basket
    clearBasket(pantry) {
        this.items.forEach(item => {
            pantry.increaseItemQuantity(item._id, item.quantity);
        });
        this.items = [];
    }

    // Method to get the items in the basket
    getBasketItems() {
        return this.items;
    }
}

module.exports = Basket;
