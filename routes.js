const path = require('path')
const mongoose = require('mongoose')
const html_to_pdf = require('html-pdf-node');
const crypto = require('crypto')
function routes(app,dbe,lms,accounts){
    let db = dbe.collection('StudentData');
    app.get('/',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','homepage.html'))
    })

    app.get('/login',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','admin.html'))
    })
    app.get('/verify',(req,res)=>{
        res.status(200).sendFile(path.join(__dirname,'public','verify.html'))
    })

    app.post("/login",(req,res)=>{
        const {username,password} = req.body
        UserAdminHardCoded = 'Admin';
        UserAdminPasswordHardCoded  = 'admin'
        if(username == UserAdminHardCoded && password == UserAdminPasswordHardCoded){
            res.status(200).sendFile(path.join(__dirname,'public','addstudent.html'))
        }else{
            res.status(401).send('Admin not approved')
        }
    })

    app.post('/addstudent',async(req,res)=>
    {
        const {fname,lname,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5} = req.body;
        console.log(fname+lname)
        let name = fname + " "+ lname
        console.log(name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5)
        db.findOne({Rollno},async (err,student)=>{
            if(student){
                console.log('Already Present');
                res.status(401).send('Already there');
            }else{   
                let dataBase = false, blockchain = false, emailSent = false;
                console.log('Not there');
                const Rollnostr = Rollno.toString();
                let ContentToHash = Rollno.toString()+Mark1.toString()+Mark2.toString()+Mark3.toString()+Mark4.toString()+Mark5.toString();
                console.log(ContentToHash);
                ContentAfterHash = crypto.createHash('md5').update(ContentToHash).digest('hex');
                console.log(ContentAfterHash);
                const proc = await db.insertOne({name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5})
                if(proc){
                    console.log('Stored in DB');
                    dataBase = true
                }else{
                    console.log('Some error occured');
                }

                const BlockChainSave = await lms.GenerateCertificate(Rollno,ContentAfterHash,{from:accounts[0]})
                if(BlockChainSave){
                    console.log('Stored in BlockChain')
                    blockchain = true
                }else{
                    console.log('Some error occured to store the value in Blockchain')
                }

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
                        let options = { format: "A4" };
                        const pdfBuffer = await html_to_pdf.generatePdf(file, options);
                        if(pdfBuffer){
                            console.log('pdfbuffer constructed');
                        }else{
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
                await sendMail().then(result=>{
                    console.log('Email sent');
                    console.log(result.code)
                    if(result.code != 400){
                        emailSent = true
                    }
                })
                .catch(error=>console.log(error.message));
                if(emailSent && blockchain && dataBase){
                    res.status(200).send('The certificate is stored in blockchain,db and the mail is sent')
                }else{
                    res.status(400).send('Error!')
                }
                
            }
        })
    })
    const pdfParse = require('pdf-parse')
    async function checkValid(Hash, Rollno) {
        console.log(Rollno)
        console.log(Hash)
        let data = await lms.RetrieveData(parseInt(Rollno),{from:accounts[0]});
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
        let invalidMarksheet = false;
        console.log(req.files)
        if(!req.files && !req.files.pdfFile){
            res.status(400);
            res.send('pdf not found')
        }
        let hash = '';
        let rollno ='';
        await pdfParse(req.files.pdfFile).then(result =>{
            console.log(result.text)
            content = result.text;
            let contentArray = content.split(" ");
            console.log(contentArray)
            let mark1,mark2,mark3,mark4,mark5;
            rollno = parseInt(contentArray[7]);
            console.log('roll: '+ rollno)
            mark1 = parseInt(contentArray[10]);
            mark2 = parseInt(contentArray[13]);
            mark3 = parseInt(contentArray[16]);
            mark4 = parseInt(contentArray[19]);
            mark5 = parseInt(contentArray[22]);
            console.log(Number.isInteger(rollno))
            if(!Number.isInteger(rollno)|| !Number.isInteger(mark1) || !Number.isInteger(mark2)|| !Number.isInteger(mark3) || !Number.isInteger(mark4) || !Number.isInteger(mark5)){
                invalidMarksheet = true
                return
            }
            
            console.log(`${rollno} = ${mark1} = ${mark2} = ${mark3} = ${mark4} = ${mark5}`);
            let ContentToHash = rollno.toString()+mark1.toString()+mark2.toString()+mark3.toString()+mark4.toString()+mark5.toString();
            console.log(ContentToHash)
            hash = crypto.createHash('md5').update(ContentToHash).digest('hex')
            
            console.log(hash);
          

        })
        let resultValid = 'invalid';
        if( !invalidMarksheet){
            resultValid = await checkValid(hash,rollno);
            console.log(resultValid)
        }
        
        if(resultValid == 'valid'){
            console.log('working')
            res.status(200).send('The certificate is Valid')
        }else{
            res.status(400).send('The certificate is invalid')
        }
        
    })
}
module.exports = routes
