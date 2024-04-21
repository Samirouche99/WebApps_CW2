class Basket {
    constructor() {
        this.items = [];
    }

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
    clearBasket(pantry) {
        this.items.forEach(item => {
            pantry.increaseItemQuantity(item._id, item.quantity);
        });
        this.items = [];
    }
    getBasketItems() {
        return this.items;
    }

}

module.exports = Basket;
