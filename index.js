var dotenv = require('dotenv');
var firebaseAdmin = require("firebase-admin");
var algoliasearch = require('algoliasearch');

// load values from the .env file in this directory into process.env
dotenv.load();

// configure firebase
var serviceAccount = require("./serviceAccountKey.json");
firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});
var database = firebaseAdmin.database();

// configure algolia
var algolia = algoliasearch(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
var index = algolia.initIndex('contacts');

// // listening is all configured, let's add some contacts
// Promise.all([
//     database.ref('/contacts/josh').set({
//         name: 'Josh',
//         city: 'San Francisco'
//     }),
//     database.ref('/contacts/tim').set({
//         name: 'Tim',
//         city: 'Paris'
//     })]).then(function() {
//     console.log("Contacts loaded to firebase");
//     process.exit(0);
// }).catch((function(error) {
//     console.error("Error loading firebase", error);
//     process.exit(-1);
// }));

// var contactsRef = database.ref("/user");
// contactsRef.once('value', initialImport);
// function initialImport(dataSnapshot) {
//     // Array of data to index
//     var objectsToIndex = [];
//     // Get all objects
//     var values = dataSnapshot.val();
//     // Process each child Firebase object
//     dataSnapshot.forEach((function(childSnapshot) {
//         // get the key and data from the snapshot
//         var childKey = childSnapshot.key;
//         var childData = childSnapshot.val();
//         // Specify Algolia's objectID using the Firebase object key
//         childData.objectID = childKey;
//         // Add object for indexing
//         objectsToIndex.push(childData);
//     }))
//     // Add or update new objects
//     index.saveObjects(objectsToIndex, function(err, content) {
//         if (err) {
//             throw err;
//         }
//         console.log('Firebase -> Algolia import done');
//         process.exit(0);
//     });
// }

var contactsRef = database.ref("/user");

contactsRef.on('child_added', addOrUpdateIndexRecord);
contactsRef.on('child_changed', addOrUpdateIndexRecord);
contactsRef.on('child_removed', deleteIndexRecord);

function addOrUpdateIndexRecord(dataSnapshot) {
    // Get Firebase object
    var firebaseObject = dataSnapshot.val();
    // Specify Algolia's objectID using the Firebase object key
    firebaseObject.objectID = dataSnapshot.key;
    // Add or update object
    index.saveObject(firebaseObject, function(err, content) {
        if (err) {
            throw err;
        }
        console.log('Firebase object indexed in Algolia', firebaseObject.objectID);
    });
}

function deleteIndexRecord(dataSnapshot) {
    // Get Algolia's objectID from the Firebase object key
    var objectID = dataSnapshot.key;
    // Remove the object from Algolia
    index.deleteObject(objectID, function(err, content) {
        if (err) {
            throw err;
        }
        console.log('Firebase object deleted from Algolia', objectID);
    });
}