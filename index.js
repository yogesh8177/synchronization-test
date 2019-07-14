const operations = {
    CREATE: 'C',
    UPDATE: 'U',
    DELETE: 'D'
};
const masterRecord = {};

/**
 * Approach 1: Using array of objects to store contact(s) for a given userId
 * @param {object} masterRecord 
 * {
 *    userId: [
 *       { name: "contact name", mobileNumber: 9090909090, recentOperation: "C", createdAt: "", updatedAt: "" },
 *       { name: "contact name", mobileNumber: 9090909091, recentOperation: "U", createdAt: "", updatedAt: "" }
 *    ]      
 * }
 */

/**
 * 
 * @param {object} payload a json object that contains contact name and mobile number
 */
function createContact(payload, operation) {
    let { userId, name, mobileNumber } = payload;
    
    if (!masterRecord.hasOwnProperty(userId)) {
        masterRecord[userId] = {
            recentOperation: operation,
            contacts: []
        };
        let timeStamp = new Date();
        let userObject = {
            name,
            mobileNumber,
            createdAt: timeStamp,
            updatedAt: timeStamp
        };
        masterRecord[userId].contacts.push(userObject);
    }
}

function updateContact(payload, operation, updatedAt) {
    let { userId, newName, name, mobileNumber } = payload;

    if (!masterRecord.hasOwnProperty(userId)) {
        console.error('user id is invalid, cannot perform update operation')
    }
    else {
        let contactIndex = searchContact(userId, name);

        if (contactIndex < 0) {
            console.error('contact not found, aborting update', userId, contactIndex);
        }
        else {
            masterRecord[userId].contacts[contactIndex].name = newName;
            masterRecord[userId].contacts[contactIndex].mobileNumber = mobileNumber;
            masterRecord[userId].contacts[contactIndex].updatedAt = updatedAt;
            masterRecord[userId].recentOperation = operation;
        }
    }
}

function searchContact(userId, contactName) {
    let result = -1;

    if (!masterRecord.hasOwnProperty(userId)) return { error: 'User id is invalid or no contact has been created for it!' };

    let currentUserContacts = masterRecord[userId].contacts || [];
    let totalContacts = currentUserContacts.length;
    

    for (let i = 0; i < totalContacts; i++) {
        let currentContact = currentUserContacts[i];
        if (!currentContact.deleted && currentContact.name === contactName)
            result = i;
        break;
    }
    return result;
}

function getPreviousOperation (userId, contactIndex) {
    if (contactIndex < 0) return { error: 'contact not found', functionName: 'getPreviousOperation' };

    let operation = masterRecord[userId].recentOperation;
    let lastModifiedAt = masterRecord[userId].contacts[contactIndex].updatedAt;

    return { operation, lastModifiedAt };
}

/**
 * 
 * @param {*} userId 
 * @param {*} contactName 
 * This case needs some more thought.
 */
function deleteContact(userId, contactName, updatedAt) {
    let contactIndex = searchContact(userId, contactName);
    if (contactIndex < 0) {
        console.error('could not delete contact as it was not found');
    }
    else {
        //masterRecord[userId].contacts.splice(contactIndex, 1);
        masterRecord[userId].deleted = true;
        masterRecord[userId].recentOperation = operations.DELETE;
        console.log(`contact ${contactName} for userId: ${userId} deleted`);
    }
}

/**
 * 
 * @param {*} payload 
 * @param {*} contactIndex 
 * Below are possible contention rules
 * a. C + C (not possible)
 * b. C + U = C
 * c. C + D = N
 * d. U + C (not possible)
 * e. U + U = U
 * f. U + D = D
 * g. D + C = U
 * h. D + U (not possible)
 * i. D + D (not possible)
 */
function resolveContention (payload, contactIndex) {
    let currentOperation = payload.operation;
    let currentModifiedAt = payload.updatedAt;
    let previousState = getPreviousOperation(payload.userId, contactIndex);
    let previousOperation = previousState.operation;
    let lastModifiedAt = previousState.lastModifiedAt;

    // C + C
    if (previousOperation === operations.CREATE && currentOperation === operations.CREATE) {
        console.log('C + C = ( not possible )');
    }
    // C + U
    else if (previousOperation === operations.CREATE && currentOperation === operations.UPDATE) {
        // lets check the timestamps for older operation and current operation.
        // Assumption: The clock is already synchronized between cloud server and mobile phone. Thus we can trust the 
        // timestamps that are coming via phone. 
        if (lastModifiedAt < currentModifiedAt) {
            console.log('C + U = C');
            // as update is similar to create
            updateContact(payload, operations.CREATE, currentModifiedAt);
        }
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('U + C = (not possible)');
        }
    }
    // C + D
    else if (previousOperation === operations.CREATE && currentOperation === operations.DELETE) {
        if (lastModifiedAt < currentModifiedAt) {
            console.log('C + D = N');
            // no change
        }
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('D + C = U');
            updateContact(payload, operations.UPDATE, lastModifiedAt);
        }
    }
    // U + C
    else if (previousOperation === operations.UPDATE && currentOperation === operations.CREATE) {
        if (lastModifiedAt < currentModifiedAt) {
            console.log('U + C = (not possible)');
        }
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('C + U = C');
            // as update is similar to create
            updateContact(payload, operations.CREATE, lastModifiedAt);
        }
    }
    // U + U
    else if (previousOperation === operations.UPDATE && currentOperation === operations.UPDATE) {
        if (lastModifiedAt < currentModifiedAt) {
            console.log('U + U = U');
            updateContact(payload, operations.UPDATE, currentModifiedAt);
        }
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('U + U = U');
            // here we won't update based on current payload as we already have most recently modified request with us
        }
    }
    // U + D
    else if (previousOperation === operations.UPDATE && currentOperation === operations.DELETE) {
        if (lastModifiedAt < currentModifiedAt) {
            console.log('U + D = D');
            deleteContact(payload.userId, payload.name, currentModifiedAt);
        }   
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('D + U (not possible)');
        }
    }
    // D + C
    else if (previousOperation === operations.DELETE && currentOperation === operations.CREATE) {
        if (lastModifiedAt < currentModifiedAt) {
            console.log('D + C = U');
            createContact(payload, operations.UPDATE);
        }   
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('C + D = ( no change )');
        }
    }
    // D + U
    else if (previousOperation === operations.DELETE && currentOperation === operations.UPDATE) {
        if (lastModifiedAt < currentModifiedAt) {
            console.log('D + U = (not possible)');
        }
        else if (lastModifiedAt > currentModifiedAt) {
            console.log('U + D = D');
            deleteContact(payload.userId, payload.name, lastModifiedAt);
        }
    }
    // D + D
    else if (previousOperation === operations.DELETE && currentOperation === operations.DELETE) {
        console.log('D + D = (not possible)');
    }
    else {
        console.log('unknown condition occurred', currentOperation, previousOperation);
    }
}

function doSync(payload) {
    let { userId, name, operation } = payload;
    let contactIndex = searchContact(userId, name);

    switch(operation) {
        case operations.CREATE:
            if (contactIndex.hasOwnProperty('error') || contactIndex < 0) {
                console.log('Empty + C = C');
                createContact(payload, operations.CREATE);
            }
            else {
                //console.log(`As contact already exists, we won't create a new contact, we might update it instead`, contactIndex, operation);
                resolveContention(payload, contactIndex);
            }
        break;

        case operations.UPDATE:
            if (contactIndex.hasOwnProperty('error') || contactIndex < 0) {
                console.log('Empty + U = ( not possible )', contactIndex);
            }
            else {
                resolveContention(payload, contactIndex);
            }
        break;

        case operations.DELETE:
            if (contactIndex.hasOwnProperty('error') || contactIndex < 0) {
                console.log('Empty + D = ( not possible )');
            }
            else {
                resolveContention(payload, contactIndex);
            }
        break;

        default:
            console.error('Invalid operation encountered!');
        break;
    }
}

let testData = [
    {
        userId: 1,
        name: 'John Cena',
        mobileNumber: 9090909090,
        operation: 'C'
    },
    {
        userId: 1,
        name: 'John Cena',
        mobileNumber: 9090909090,
        operation: 'C'
    },
    {
        userId: 2,
        name: 'John Cena',
        mobileNumber: 9090909090,
        operation: 'C',
    },
    {
        userId: 1,
        name: 'John Cena',
        newName: 'John Cenaa',
        mobileNumber: 9090909091,
        operation: 'U',
        updatedAt: new Date().setDate(16)
    },
    {
        userId: 1,
        name: 'John Cenaa',
        mobileNumber: 9090909091,
        operation: 'D',
        updatedAt: new Date().setDate(17)
    }
]

for (let i = 0; i < testData.length; i++) {
    doSync(testData[i]);
    //console.log(i, JSON.stringify(testData[i]));
}

console.log(JSON.stringify(masterRecord, null, 2));

// payload 
/**
 * {
 *    userId: 1,
 *    name: "John Cena",
 *    mobileNumber: 9090909090,
 *    operation: "U",
 *    updatedAt: "12-02-2019 14:23:45"
 * }
 */
