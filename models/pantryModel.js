// models/pantryModel.js

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

  init() {
    this.db.count({}, (err, count) => {
      if (err) {
        console.error("Failed to count database entries:", err);
        return;
      }
      if (count === 0) {
        this.db.insert([
          { _id: '8', name: 'Apple', expDate: '2024-05-01', quantity: 5 },
          { _id: '2', name: 'Apple2', expDate: '2024-05-01', quantity: 4 },
          { _id: '3', name: 'Apple3', expDate: '2024-05-01', quantity: 7 },
          { _id: '4', name: 'Apple', expDate: '2024-05-01', quantity: 5 },
          { _id: '5', name: 'Apple2', expDate: '2024-05-01', quantity: 4 },
          { _id: '36', name: 'Apple3', expDate: '2024-05-01', quantity: 7 },
          { _id: '14', name: 'Apple', expDate: '2024-05-01', quantity: 5 },
          { _id: '24', name: 'Apple2', expDate: '2024-05-01', quantity: 4 },
          { _id: '93', name: 'Apple3', expDate: '2024-05-01', quantity: 7 },
          { _id: '13', name: 'Apple', expDate: '2024-05-01', quantity: 5 },
          { _id: '9', name: 'Apple2', expDate: '2024-05-01', quantity: 4 },
          { _id: '32', name: 'Apple3', expDate: '2024-05-01', quantity: 7 },
          { _id: '15', name: 'Apple', expDate: '2024-05-01', quantity: 5 },
          { _id: '222', name: 'Apple2', expDate: '2024-05-01', quantity: 4 },
          { _id: '35', name: 'Apple3', expDate: '2024-05-01', quantity: 7 },
          { _id: '11', name: 'Apple', expDate: '2024-05-01', quantity: 5 },
          { _id: '22', name: 'Apple2', expDate: '2024-05-01', quantity: 4 },
          { _id: '33', name: 'Apple3', expDate: '2024-05-01', quantity: 7 },
          { _id: '43', name: 'Apple9', expDate: '2024-05-01', quantity: 7 }
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


  getAllEntries() {
    return new Promise((resolve, reject) => {
      this.db.find({}, function (err, entries) {
        if (err) {
          reject(err);
        } else {
          resolve(entries);
        }
      });
    });
  }

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
  updateEntry(itemId, name, expDate, quantity) {
    return new Promise((resolve, reject) => {
        this.db.update({ _id: itemId }, { $set: { name, expDate, quantity } }, {}, (err, numReplaced) => {
            if (err) reject(err);
            else resolve(numReplaced);
        });
    });
}

// Deleting an entry
deleteEntry(itemId) {
    return new Promise((resolve, reject) => {
        this.db.remove({ _id: itemId }, {}, (err, numRemoved) => {
            if (err) reject(err);
            else resolve(numRemoved);
        });
    });
}
decreaseItemQuantity(itemId, quantity) {
  this.db.update({ _id: itemId }, { $inc: { quantity: -quantity } }, {}, (err) => {
      if (err) console.error('Failed to decrease item quantity:', err);
  });
}

increaseItemQuantity(itemId, quantity) {
  this.db.update({ _id: itemId }, { $inc: { quantity: quantity } }, {}, (err) => {
      if (err) {
          console.error('Failed to increase item quantity:', err);
          throw new Error('Database update failed'); // Throw or handle it more gracefully depending on your error handling strategy
      }
  });
}


}


module.exports = Pantry;
