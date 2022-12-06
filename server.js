
const express= require('express')
const app =express()
const routes = require('./routes')
const Web3 = require('web3');
const mongodb = require('mongodb').MongoClient
const contract = require('truffle-contract');
const artifacts = require('./build/Certification.json');


app.use(express.json())


if (typeof web3 !== 'undefined') {
    var web3 = new Web3(web3.currentProvider)
  } else {
    var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
}

const LMS = contract(artifacts)
LMS.setProvider(web3.currentProvider)

mongodb.connect('mongodb://localhost:27017',{ useUnifiedTopology: true }, async(err,client)=>{
    if(client){
        console.log('Done')
    }
    await client.connect()
    //console.log(client.db())
    const db =client.db('Student')
    //console.log(db)
    const accounts = await web3.eth.getAccounts();
    //console.log(accounts)
    const lms = await LMS.deployed();
    //console.log(lms)
    //const lms = LMS.at(contract_address) for remote nodes deployed on ropsten or rinkeby
    routes(app,db, lms, accounts)
    app.listen(process.env.PORT || 8082, () => {
        console.log('listening on port '+ (process.env.PORT || 8082));
     })
})
