David Hall CS764 HW 3 2/4/2019
READ.ME
Description
The following program is intended to be an implementation of a basic blockchain. All transactions are generated
randomly, with 5 per customer and randomly assigned merchants and values.

Input
The program is not intended to take an input, it should be considered as a simulation

Output
There are 4 distinct outputs:
1) A list of all transactions, including the 1st 4 fields for each one.
2) A list of the transactions for a single customer
3) A list of the transactions for a single merchant
4) A demonstration that the block chain can detect tampering. One transaction will have its value manually altered
and it will demonstrate a before and after indication of this.

Execution information:
The program is written in JavaScript using Node.JS. On a system with Node installed, unzip the contents of the zip file
into an empty directory. Type 'npm install' <enter>. The program can then be run by entering './node main.js.'