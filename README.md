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

