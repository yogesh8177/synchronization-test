# synchronization-test

# Requirements

You maintain your list of contacts on a Cloud Server as well as on your phone.
You create, modify and delete contacts on both systems and synchronize them
periodically.
Each contact consists of a Name and a Phone Number.
For all the questions below, ignore database issues and assume that all data that you
need is contained in data structures in memory.
i. For simplicity, assume that the contact list is not very large. Describe the
algorithm used to synchronize these changes
ii. Write a doSync method to implement your synchronization algorithm on the
master desktop. Assume that all required data transmitted by the handheld
has been read in and can be passed to your method as parameters. All
master data is already in memory and can also be passed to your method.
iii. Optional - would your algorithm change if the contact list was very large?
Continue to assume that everything is contained in memory.
iv. Optional - would your algorithm change if there were multiple handhelds and
many users using the master desktop?

# Assumptions

1. Assume that the Name of the contact is the primary identifier and is to be
used as the key in distinguishing one contact from another.
2. If the name is changed it is equivalent to the old name being deleted and a
new name being created.
3. All the possible actions that can be done on a contact are
a. Create (C)
b. Delete (D)
c. Update (U)
d. No change (N)
4. If multiple actions happen in sequence on the same contact either on the
master desktop or the hand held device they will be combined using the
following rules:
a. C + C (not possible)
b. C + U = C
c. C + D = N
d. U + C (not possible)
e. U + U = U
f. U + D = D
g. D + C = U
h. D + U (not possible)
i. D + D (not possible)
5. System time on the master and hand held are synchronized via timestamps

# Algorithm

### Assuming that we have everything related to data in memory, the algorith for master computer us as follows:

1. Fetch handheld device input.
2. Search for the contact in the input payload in our primary DB (masterRecord in this case)
3. If we have such a record on our master server, the any of the following will happen:
  - Fetch previous `PO` operation that was performed with the lastModified timestamp.
  - Lets consider current operation to perform be denoted by `CO`
  - Key notations: C - Create, U - Update, D - Delete, E - Empty or no operation, N - No Change
     ```
      PO = fetchPreviousOperation(userId, contactName);

      if (PO == 'E' && CO == 'C') then
        createContact(userId, contactPayload);
      else if (PO == 'C' && CO == 'C') then
        C + C (not possible)
      else if (PO = 'C' && CO == 'U') then
        if (PO.lastModifiedAt < CO.lastModifiedAt)
          //as update is same as create. Also we need to update the timeStamp with the most recent change
          C + U = U
          update(userId, contactName, 'C', CO.updatedAt); 
        else if (PO.lastModifiedAt > CO.lastModifiedAt)
           U + C = ( not possible )
     ```
Above steps will give you the gist of the algorithm implemented. Code will clear out all such use cases.
We can go through the `doSync()` function in our `index.js` file.

- Time plays a vital role in determining which change should be treated in what sequence! There might be a case where even though device `A` updated before device `B` could update, but device `A` was not connected to internet for a long time and during that time period, device `B` posted an update. Thus, now we have device `B` synced with our main server, but device `A` is not. Once internet resumes on device `A`, it attempts to sync data with our main server. And since our previous operation was done on device `A` instead of device `B`, while sync operation of `A` ins underway, we look at the timestamp on the main server and from the payload of device `A`. In this case, device `A` was first to make an update, but device `B` got its data synced before device `A` could sync with the main server! Thus, we then assume that device `A` update should be given first priority even though `B` has synced with main server. Thus, we apply the contention rules given above by making appropriate change in operation sequences using timestamps.
