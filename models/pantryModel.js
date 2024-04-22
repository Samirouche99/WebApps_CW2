
const nedb = require('nedb');

class Pantry {
  constructor(dbFilePath) {
    if (dbFilePath) {
      this.db = new nedb({ filename: dbFilePath, autoload: true });
      console.log('DB connected to ' + dbFilePath);
    } else {
      this.db = new nedb();
    }
  }

  // Method to initialize the database with default items
  init() {
    this.db.count({}, (err, count) => {
      if (err) {
        console.error("Failed to count database entries:", err);
        return;
      }
      if (count === 0) {
        this.db.insert([
          
            { _id: '8', name: 'Apple', expDate: '2024-04-25', quantity: 15 },
            { _id: '2', name: 'Banana', expDate: '2024-05-10', quantity: 10 },
            { _id: '3', name: 'Orange', expDate: '2024-05-15', quantity: 7 },
            { _id: '4', name: 'Mango', expDate: '2024-04-20', quantity: 12 },
            { _id: '5', name: 'Peach', expDate: '2024-05-05', quantity: 4 },
            { _id: '36', name: 'Pear', expDate: '2024-06-01', quantity: 20 },
            { _id: '14', name: 'Kiwi', expDate: '2024-05-01', quantity: 18 },
            { _id: '24', name: 'Blueberry', expDate: '2024-04-22', quantity: 6 },
            { _id: '93', name: 'Strawberry', expDate: '2024-04-30', quantity: 25 },
            { _id: '13', name: 'Cherry', expDate: '2024-05-23', quantity: 5 },
            { _id: '9', name: 'Watermelon', expDate: '2024-06-15', quantity: 3 },
            { _id: '32', name: 'Grape', expDate: '2024-05-27', quantity: 8 },
            { _id: '15', name: 'Melon', expDate: '2024-04-28', quantity: 10 },
            { _id: '222', name: 'Blackberry', expDate: '2024-05-15', quantity: 9 },
            { _id: '35', name: 'Raspberry', expDate: '2024-06-20', quantity: 14 },
            { _id: '11', name: 'Lemon', expDate: '2024-05-22', quantity: 16 },
            { _id: '22', name: 'Lime', expDate: '2024-06-10', quantity: 12 },
            { _id: '33', name: 'Grapefruit', expDate: '2024-05-30', quantity: 11 },
            { _id: '43', name: 'Plum', expDate: '2024-05-01', quantity: 7 }
        
        
        ], function (err) {
          if (err) {
            console.error("Error initializing the database with default items:", err);
          } else {
            console.log("Database initialized with default items.");
          }
        });
      } else {
        console.log("Database already initialized.");
      }
    });
  }

    // Method to find items by their IDs..used to display basket
  findItemsById(ids) {
    return new Promise((resolve, reject) => {
      this.db.find({ _id: { $in: ids } }, function (err, items) {
        if (err) {
          reject(err);
        } else {
          resolve(items || []);  // Ensure an array is always returned
        }
      });
    });
  }

 // Method to find items by their IDs..used to display pantry and remove and add items in basket from basket page
  findItemById(id) {
    return new Promise((resolve, reject) => {
        this.db.findOne({ _id: id }, function (err, item) {
            if (err) {
                reject(err);
            } else {
                resolve(item);  // Return the found item or undefined if not found
            }
        });
    });
}

//display pantry and check for out of date .. deletes out of date items from pantry
getAllEntries() {
  return new Promise((resolve, reject) => {
    const today = new Date().toISOString().slice(0, 10); 
    this.db.find({}, (err, entries) => {
      if (err) {
        reject(err);
      } else {
        const validEntries = entries.filter(entry => {
          if (entry.expDate < today) {
            console.log(`Removing out-of-date stock: ${entry.name}, Expired on: ${entry.expDate}`);
            this.deleteEntry(entry._id);
            return false;
          }
          return true;
        });
        resolve(validEntries);
      }
    });
  });
}

//search db method for search bar
  searchProduct(query) {
    return new Promise((resolve, reject) => {
      this.db.find({ name: { $regex: new RegExp(query, 'i') } }, function (err, results) {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
    });
  }

  //add new item
  addEntry(name, expDate, quantity) {
    return new Promise((resolve, reject) => {
        const entry = {
            name: name,
            expDate: expDate,
            quantity: parseInt(quantity)  // Ensure quantity is treated as a number
        };

        // Generate a unique ID
        const generateId = () => {
            return '_' + Math.random().toString(36).substr(2, 9);
        };

        const id = generateId();
        entry._id = id;

        console.log('Entry created:', entry);

        this.db.insert(entry, function (err, doc) {
            if (err) {
                console.error('Error inserting document', name);
                reject(err); // Reject the promise if there's an error
            } else {
                console.log('Document inserted into the database:', doc);
                resolve(doc); // Resolve the promise with the document
            }
        });
    });
}

//admin update item
updateEntry(itemId, name, expDate, quantity) {
  return new Promise((resolve, reject) => {
      const updatedData = {
          name: name,
          expDate: expDate,
          quantity: parseInt(quantity, 10) // Converts the quantity to an integer
      };
      this.db.update({ _id: itemId }, { $set: updatedData }, {}, (err, numReplaced) => {
          if (err) {
              console.error('Error updating item:', err);
              reject(err);
          } else {
              console.log(`Updated item ${itemId}:`, numReplaced);
              resolve(numReplaced); // Resolve with the count of replaced documents
          }
      });
  });
}


// admin, deleting an entry
deleteEntry(itemId) {
    return new Promise((resolve, reject) => {
        this.db.remove({ _id: itemId }, {}, (err, numRemoved) => {
            if (err) reject(err);
            else resolve(numRemoved);
        });
    });
}


decreaseItemQuantity(itemId, quantity) {
  return new Promise((resolve, reject) => {
      this.db.update({ _id: itemId }, { $inc: { quantity: -quantity } }, {}, (err, numUpdated) => {
          if (err) {
              console.error('Failed to decrease item quantity:', err);
              reject(err);
          } else {
              console.log(`Decreased quantity for item ${itemId}`);
              resolve(numUpdated);  // Resolve the promise with the number of documents updated
          }
      });
  });
}

increaseItemQuantity(itemId, quantity) {
  return new Promise((resolve, reject) => {
      this.db.update({ _id: itemId }, { $inc: { quantity: quantity } }, {}, (err, numUpdated) => {
          if (err) {
              console.error('Failed to increase item quantity:', err);
              reject(err);
          } else {
              console.log(`Increased quantity for item ${itemId}`);
              resolve(numUpdated);  // Resolve the promise with the number of documents updated
          }
      });
  });
}

}
module.exports = Pantry;
