
const express= require('express')
const app =express()
const routes = require('./routes')
const Web3 = require('web3');
const mongodb = require('mongodb').MongoClient
const contract = require('truffle-contract');
const artifacts = require('./build/Certification.json');
const fileUpload = require("express-fileupload");
const cors = require('cors')
var favicon = require('serve-favicon');
var path = require('path')
app.use(favicon(path.join(__dirname, 'public', 'images/website.png')))
app.use(fileUpload());
app.use(express.json())
app.use(express.urlencoded())
app.use(cors())
app.use(express.static(__dirname + '/public'));


if (typeof web3 !== 'undefined') {
    var web3 = new Web3(web3.currentProvider)
  } else {
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
}

const LMS = contract(artifacts)
LMS.setProvider(web3.currentProvider)

mongodb.connect('mongodb+srv://dbUser:dbUser@cluster0.dwdoiai.mongodb.net/?retryWrites=true&w=majority',{ useUnifiedTopology: true }, async(err,client)=>{
    if(client){
        console.log('Done')
    }
    await client.connect()
    const db =client.db('Student')
    const accounts = await web3.eth.getAccounts();
    console.log(accounts[0])
    const lms = await LMS.deployed();
    routes(app,db, lms, accounts)
    app.listen(process.env.PORT || 3005, () => {
        console.log('listening on port '+ (process.env.PORT || 3005));
     })
})
