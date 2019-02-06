const SHA256 = require('crypto-js/sha256');
const NodeRSA = require('node-rsa');
const fs = require('fs');

const file = fs.createWriteStream('./blockchain_output.txt');
class Block{
    constructor(trans, sequenceNum, prevBlock){
            this.transaction = trans;
            this.sequenceNum = sequenceNum;
            if(prevBlock) {
                this.previousHash = prevBlock.calculateHash();
            }
            else{
                this.previousHash = 0;
            }
            this.minerSig = '';

        //console.log(JSON.stringify(this,null,4));
    }

    calculateHash(){
        return SHA256(JSON.stringify(this.transaction.custPubKey) + JSON.stringify(this.transaction.merchPubKey)
            + this.transaction.date + this.transaction.amount.toString() + JSON.stringify(this.transaction.custSig)
            + JSON.stringify(this.transaction.merchSig) + this.sequenceNum.toString() );
    }
}

class Miner{
    constructor(){
        this.key = new NodeRSA({b: 512});
        this.chain = [this.createGenesisBlock()];
    }

    createGenesisBlock(){
        let newBlock = new Block(this.getBlankTrans(),0,null);
        newBlock.minerSig = this.signBlock(newBlock);
        return newBlock;
    }

    getBlankTrans(){
        return new Transaction(0,0,0,0);
    }

    getLatestBlock(){
        return this.chain[this.chain.length-1];
    }

    addTransaction(trans){
        let prevBlock = this.getLatestBlock();
        const seqNum = prevBlock.sequenceNum + 1;
        let newBlock = new Block(trans,seqNum,prevBlock);
        newBlock.minerSig = this.signBlock(newBlock);
        this.chain.push(newBlock);
    }



    isChainValid(){
        for(let i=1; i< this.chain.length;i++){
            const currentBlock = this.chain[i];
            const prevBlock = this.chain[i-1];

            if(!this.verifySign(currentBlock)){
                return false
            }
            const prevHashString = (currentBlock.previousHash).toString();
            const prevHashCalcString = prevBlock.calculateHash().toString();
            if(prevHashString !== prevHashCalcString){
               //console.log("............Failed checking current block previous hash against last block hash..............");
               //console.log(currentBlock.previousHash.toString());
               //console.log(prevBlock.calculateHash().toString());
               //console.log("Transaction " + i + " has been altered");
                file.write("............Failed checking current block previous hash against last block hash..............\n");
                file.write(currentBlock.previousHash.toString()+"\n");
                file.write(prevBlock.calculateHash().toString()+"\n");
                file.write("Transaction " + i + " has been altered\n");
                return false;
            }
        }
        return true;
    }

    printTransaction(i){
        //console.log("Transaction number: " + i);
        //console.log("Customer public key:");
        //console.log(this.chain[i].transaction.custPubKey);
        //console.log("Merchant public key:");
        //console.log(this.chain[i].transaction.merchPubKey + "\n");
        //console.log("Date: " + this.chain[i].transaction.date);
        //console.log("Amount: " + this.chain[i].transaction.amount);
        file.write("Transaction number: " + i +"\n");
        file.write("Customer public key:"+"\n");
        file.write(this.chain[i].transaction.custPubKey+"\n");
        file.write("Merchant public key:"+"\n");
        file.write(this.chain[i].transaction.merchPubKey + "\n");
        file.write("Date: " + this.chain[i].transaction.date+"\n");
        file.write("Amount: " + this.chain[i].transaction.amount+"\n");
    }

    printAllTransactions(){
        //console.log("Printing all transactions.........................................\n");
        file.write("Printing all transactions.........................................\n");
        for(let i=1;i<this.chain.length;i++){
            this.printTransaction(i);
        }
    }

    printByCustomer(customer){
        //console.log("Printing by customer.........................................\n");
        file.write("Printing by customer.........................................\n");
        for(let i=0;i<this.chain.length;i++){
            if(this.chain[i].transaction.custPubKey === customer.getPubKey())
                this.printTransaction(i);
        }
    }

    printByMerchant(merchant){
        //console.log("Printing by merchant.........................................\n");
        file.write("Printing by merchant.........................................\n");
        for(let i=0;i<this.chain.length;i++){
            if(this.chain[i].transaction.merchPubKey === merchant.getPubKey())
                this.printTransaction(i);
        }
    }

    signBlock(block){
        const sigString = block.merchSig + block.sequenceNum + block.previousHash;
        return this.key.sign(sigString);
    }

    verifySign(block){
        const sigString = block.merchSig + block.sequenceNum + block.previousHash
        return this.key.verify(sigString,block.minerSig);
    }

    getPubKey(){
        return this.key.exportKey('pkcs8-public');
    }
}

class Customer{
    constructor(){
        this.key = new NodeRSA({b:512});
    }

    signTrans(trans){
        const sigString = trans.custPubKey + trans.merchPubKey + trans.date + trans.amount;
        return this.key.sign(sigString);
    }

    getPubKey(){
        return this.key.exportKey('pkcs8-public');
    }
}

class Merchant{
    constructor(){
        this.key = new NodeRSA({b:512});
    }

    signTrans(trans){
        const sigString = trans.custPubKey + trans.merchPubKey + trans.date + trans.amount + trans.custSig;
        return this.key.sign(sigString);
    }

    getPubKey(){
        return this.key.exportKey('pkcs8-public');
    }

    newTransaction(cust,date,amount,miner){
        let trans = new Transaction(cust,this,date,amount);
        miner.addTransaction(trans);
    }
}

class Transaction{
    constructor(customer,merchant, date,amount){

        if(customer !==0) {
            this.custPubKey = customer.getPubKey();
            this.merchPubKey = merchant.getPubKey();
            this.date = date;
            this.amount = amount;
            this.custSig = customer.signTrans(this);
            this.merchSig = merchant.signTrans(this);
        }
        else {
            this.custPubKey = 0;
            this.merchPubKey = 0;
            this.date = 0;
            this.amount = 0;
            this.custSig = 0;
            this.merchSig = 0;
        }
        //console.log(JSON.stringify(this,null,4));
    }
}

function getRandomInt(max){
    return Math.floor(Math.random() * max)+1;;
}

function getRandomDate(){
    const month = getRandomInt(12).toString();
    let day = '';
    const year = (getRandomInt(70)+1950).toString();
    if(month in ["1","3","5","7","8","10","12"]){
        day = (getRandomInt(31)).toString();
    }
    else if(month === "2"){
        day = getRandomInt(28).toString();
    }
    else{
        day = getRandomInt(30).toString();
    }

    return month + "/" + day + "/" + year;
}

function getRandomPrice(){
    const raw = Math.random()*3000 / 3;
    return raw.toFixed(2);
}

function transactionGenerator(miner,customers,merchants){

    for(let i=0;i<customers.length;i++){
        for(let i=0;i<5;i++){
            let date = getRandomDate();
            let amount = getRandomPrice();
            let merch = merchants[getRandomInt(2)-1];
            merch.newTransaction(customers[i],date,amount,miner);
        }
    }
}

let miner = new Miner();

let customers = [new Customer(),new Customer(),new Customer(),new Customer(),new Customer()];

let merchants = [new Merchant(), new Merchant()];


transactionGenerator(miner,customers,merchants);
miner.printAllTransactions();
//console.log("--------------------------------------------------------------------------------------------------------");
file.write("--------------------------------------------------------------------------------------------------------"+"\n");
miner.printByCustomer(customers[2]);
//console.log("--------------------------------------------------------------------------------------------------------");
file.write("--------------------------------------------------------------------------------------------------------"+"\n");
miner.printByMerchant((merchants[1]));
//console.log("--------------------------------------------------------------------------------------------------------");
//console.log("Verifying the chain has not been tampered with: ");
//console.log((miner.isChainValid()) ? "The chain is unaltered" : "The chain has been altered");
file.write("--------------------------------------------------------------------------------------------------------"+"\n");
file.write("--------------------------------------------------------------------------------------------------------"+"\n");
file.write("Verifying the chain has not been tampered with: "+"\n");
file.write((miner.isChainValid()) ? "The chain is unaltered" : "The chain has been altered"+"\n");
file.write("--------------------------------------------------------------------------------------------------------"+"\n");

//console.log("Altering the chain...");
file.write("Altering the chain..."+"\n");
miner.chain[14].transaction.amount += 10;
//console.log("Verifying the chain has been tampered with: ");
//console.log((miner.isChainValid()) ? "The chain is unaltered" : "The chain has been altered");
file.write("Verifying the chain has been tampered with: "+"\n");
file.write((miner.isChainValid()) ? "The chain is unaltered" : "The chain has been altered"+"\n");

file.end();