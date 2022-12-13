const path = require('path')
const mongoose = require('mongoose')
const SHA256 = require("crypto-js/sha256");
const sgMail = require('@sendgrid/mail')
const html_to_pdf = require('html-pdf-node');
const crypto = require('crypto')
/*const studentSchema = new mongoose.Schema({
    name : String,
    rollno : Number,
    email : String,
    mark1 : Number,
    mark2 : Number,
    mark3 : Number,
    mark4 : Number,
    mark5 : Number
})
const Student = new mongoose.model("students",studentSchema)*/
function routes(app,dbe,lms,accounts)
{
    let db = dbe.collection('StudentData');
    /*if(db)
    {
        console.log('DB collection done')
    }*/
    app.get('/',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','homepage.html'))
    })


    app.get('/signup',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','signup.html'))
    })


    app.get('/login',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','index.html'))
    })
    app.get('/verify',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','verify.html'))
    })

    app.post("/login",(req,res)=>{
        const {username,password} = req.body
        console.log(req.body)
        UserAdminHardCoded = 'Admin';
        UserAdminPasswordHardCoded  = 'admin'
        if(username == UserAdminHardCoded && password == UserAdminPasswordHardCoded)
        {
            res.status(200).sendFile(path.join(__dirname,'public','addstudent.html'))
        }
        else
        {
            res.status(401).send('Admin not approved')
        }
    })

    app.post('/addstudent',async(req,res)=>
    {
        const {name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5} = req.body;
        console.log(name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5)
        db.findOne({Rollno},async (err,student)=>{
            if(student)
            {
                console.log('Already Present');
                res.status(401).send('Already there');
            }
            else
            {
                console.log('Not there');
                const Rollnostr = Rollno.toString();
                console.log(Rollnostr)
                let ContentToHash = Rollno.toString()+Mark1.toString()+Mark2.toString()+Mark3.toString()+Mark4.toString()+Mark5.toString();
                console.log(ContentToHash);
                console.log(typeof(ContentToHash))
                ContentAfterHash = crypto.createHash('md5').update(ContentToHash).digest('hex');
                console.log(ContentAfterHash);
                console.log(typeof(ContentAfterHash));
                const proc = db.insertOne({name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5})
                if(proc)
                {
                    console.log('Stored in DB');
                }
                else
                {
                    console.log('Some error occured');
                    
                }
                const BlockChainSave = await lms.GenerateCertificate(Rollno,ContentAfterHash,{from:accounts[0]})
                if(BlockChainSave)
                {
                    console.log('Stored in BlockChain')
                }
                else
                {
                    console.log('Some error occured to store the value in Blockchain')
                }
                sgMail.setApiKey('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');
                
                let HTMLContent = `
                <h1> Marksheet 2022-23</h1><br>
                <strong> Name : ${name}</strong><br>
                <strong> Rollno : ${Rollno}</strong><br>
                <strong> Mark1 : ${Mark1} </strong> <br>
                <strong> Mark2 : ${Mark2} </strong> <br>
                <strong> Mark3 : ${Mark3} </strong> <br>
                <strong> Mark4 : ${Mark4} </strong> <br>
                <strong> Mark5 : ${Mark5} </strong> <br>`;
                const nodemailer = require('nodemailer');
                const {google} = require('googleapis');
                const CLIENT_ID = '787846123554-hdadcrlmr8prolpfrqn9gjvob2k0nshd.apps.googleusercontent.com';
                const CLIENT_SECRET = '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';
                const REDIRECT_URL = 'https://developers.google.com/oauthplayground';
                const REFRESH_TOKEN = '1//048oCJdihTOV3CgYIARAAGAQSNwF-L9IryQ8kTqCCp5QKqREgUTqK8wWo-KoaQur0-nMwwy4T6SJ75PHdRk5TvUxQVQxQoz0zfYM';
                const oAuth2Client = new google.auth.OAuth2(CLIENT_ID,CLIENT_SECRET,REDIRECT_URL);
                oAuth2Client.setCredentials({refresh_token:REFRESH_TOKEN});
                async function sendMail()
                {
                    try
                    {
                        const accessToken = await oAuth2Client.getAccessToken();
                        //console.log(accessToken)
                        const transport = nodemailer.createTransport({
                            service:'gmail',
                            auth:{
                                type:'OAuth2',
                                user:'verifiertheoriginal@gmail.com',
                                clientId:CLIENT_ID,
                                clientSecret:CLIENT_SECRET,
                                refreshToken:REFRESH_TOKEN,
                                accessToken:'ya29.a0AeTM1ifprnGPWk9aIgoBSldYEXcHl9vpvqyr9Eg8jf3mqyLmj3qLUB3hH12xQejWukfjSTBr4yRoVqPB1rA4ev7vsxtkyMroUPnv5SCb8R4h8V_UCTGKYJJEYAQDFgfC43tLEyUC2hM8VDjneBJLZweT8ACCaCgYKAfsSARASFQHWtWOm-eJ0dCZpashDck_Oamhjkg0163'
                            }
                        })
                        let file = { content: HTMLContent };
                        //console.log(file)
                        let options = { format: "A4" };
                        const pdfBuffer = await html_to_pdf.generatePdf(file, options);
                        console.log(pdfBuffer)
                        if(pdfBuffer)
                        {
                            console.log('pdfbuffer constructed');
                        }
                        else
                        {
                            console.log('Could not construct pdfBuffer')
                        }
                        const mailOptions = {
                            from : 'verifiertheoriginal@gmail.com',
                            to : Email,
                            subject : "Marksheet 2022-23",
                            
                            attachments: [{

                                filename: `Marksheet.pdf`,
                                content: pdfBuffer
                            
                            }],
                            html:  HTMLContent,
                        }
                        const result = await transport.sendMail(mailOptions);
                        return result;
                    }catch(error){
                        return error
                    }
                
                }
                sendMail().then(result=>console.log('Email sent',result))
                .catch(error=>console.log(error.message));

                res.status(200).send('The certificate is stored in blockchain,db and the mail is sent')
            }
        })
    })
    const pdfParse = require('pdf-parse')
    async function checkValid(Hash, Rollno) {
        console.log(Rollno)
        console.log(Hash)
        let data = await lms.RetrieveData(Rollno,{from:accounts[0]});
            console.log(data);
            console.log(data[1])
            console.log(typeof(Hash));
            console.log(typeof(data[1]));
            if(Hash == data[1])
            {
                console.log('The certificate is valid');
                return 'valid'
            }
            else
            {
                console.log('Invalid certificate');
                return 'invalid'
            }
      }
    app.post('/verifyMarksheet',async(req,res)=>{
        let content = "";
        console.log(req.files)
        if(!req.files && !req.files.pdfFile){
            res.status(400);
            res.send('pdf not found')
        }
        let Hash = '';
        let Rollno ='';
        await pdfParse(req.files.pdfFile).then(result =>{
            console.log(result.text)
            // res.send(result.text)
            content = result.text;
            let contentArray = content.split(" ");
            console.log(contentArray)
            let rollno = parseInt(contentArray[6]);
            console.log('roll: '+ rollno)
            Rollno = rollno
            let mark1 = parseInt(contentArray[9]);
            let mark2 = parseInt(contentArray[12]);
            let mark3 = parseInt(contentArray[15]);
            let mark4 = parseInt(contentArray[18]);
            let mark5 = parseInt(contentArray[21]);
            console.log(`${rollno} = ${mark1} = ${mark2} = ${mark3} = ${mark4} = ${mark5}`);
            let ContentToHash = rollno.toString()+mark1.toString()+mark2.toString()+mark3.toString()+mark4.toString()+mark5.toString();
            console.log(ContentToHash)
            let hash = crypto.createHash('md5').update(ContentToHash).digest('hex')
            
            console.log(hash);
            Hash = hash
            checkValid(hash,rollno)
            // compare the hash if same res.send(true)
            
        })
        // console.log(Hash)
        
    })
    
    // app.post('/verifyMarksheet',async(req,res)=>{
    //     console.log(req)
    //     // pdfParse(req).then(result =>{
    //     //         console.log(result.text)
    //     // })
    //     let content = "";
    //     res.send('yes')
    //     return
    //     // if(!req.files && !req.files.pdfFile){
    //     //     res.status(400);
    //     //     res.send('pdf not found')
    //     // }
    //     // pdfParse(req.files.pdfFile).then(result =>{
    //     //     console.log(result.text)
    //     //     res.send(result.text)
    //     //     content = result.text;
    //     //     let contentArray = content.split(" ");
    //     //     let rollno = parseInt(contentArray[7]);
    //     //     let mark1 = contentArray[10];
    //     //     let mark2 = contentArray[13];
    //     //     let mark3 = contentArray[16];
    //     //     let mark4 = contentArray[19];
    //     //     let mark5 = contentArray[22];
    //     //     // console.log(`${rollno} = ${mark1} = ${mark2} = ${mark3} = ${mark4} = ${mark5}`);
    //     //     let totContent = rollno + mark1 + mark2 + mark3 + mark4 + mark5;
    //     //     console.log(totContent)
    //     //     let hash = SHA256(totContent)
    //     //     console.log(hash);
    //     //     // compare the hash if same res.send(true)
    //     // })
        
        
        
    //     // const {name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5} = req.body;
    //     //const Hash = Rollno.toString()+Mark1.toString()+Mark2.toString()+Mark3.toString()+Mark4.toString()+Mark5.toString();
    //     const Hash = 'b38bf3ed653cf286c499037540cac898';
    //     console.log(Hash);
    //     let data = await lms.RetrieveData(Rollno,{from:accounts[0]});
    //     console.log(data);
    //     console.log(data[1])
    //     console.log(typeof(Hash));
    //     console.log(typeof(data[1]));
    //     if(Hash == data[1])
    //     {
    //         console.log('The certificate is valid');
    //         res.status(200).send('Valid certificate')
    //     }
    //     else
    //     {
    //         console.log('Invalid certificate');
    //         res.status(401).send('Invalid certificate not found in blockchain')
    //     }
    //     /*let content = "";
    //     if(!req.files && !req.files.pdfFile)
    //     {
    //         res.status(400);
    //         res.send('pdf not found')
    //     }
    //     else
    //     {
    //         //PDF send kar
    //         pdfParse(req.files.pdfFile).then(result =>{
    //             console.log(result.text)
    //             res.send(result.text)
    //             content = result.text;
    //             let contentArray = content.split(" ");
    //             let rollno = parseInt(contentArray[7]);
    //             let mark1 = contentArray[10];
    //             let mark2 = contentArray[13];
    //             let mark3 = contentArray[16];
    //             let mark4 = contentArray[19];
    //             let mark5 = contentArray[22];
    //             // console.log(`${rollno} = ${mark1} = ${mark2} = ${mark3} = ${mark4} = ${mark5}`);
    //             let totContent = rollno + mark1 + mark2 + mark3 + mark4 + mark5;
    //             console.log(totContent)
    //             let hash = SHA256(totContent)
    //             console.log(hash);
    //             // compare the hash if same res.send(true)
    //         })
    //     }*/
        
    
    // })


}
module.exports = routes
