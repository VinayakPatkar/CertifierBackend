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


    app.post("/login",(req,res)=>{
        const {username,password} = req.body
        console.log(req.body)
        UserAdminHardCoded = 'Vinayak';
        UserAdminPasswordHardCoded  = 'Patkar'
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
                //console.log(HTMLContent);
                
                const sendPDF = async(email) =>{
                    let file = { content: HTMLContent };
                    //console.log(file)
                    let options = { format: "A4" };
                    const pdfBuffer = html_to_pdf.generatePdf(file, options);
                    if(pdfBuffer)
                    {
                        console.log('pdfbuffer constructed');
                    }
                    else
                    {
                        console.log('Could not construct pdfBuffer')
                    }
                    const msg = {
                    to: email,
                    from: 'karrajput3948@gmail.com', // Use the email address or domain you verified above
                    subject: 'Marksheet 2022-23',
                    text: 'Marksheet',
                    Attachments : [
                    {
                        content: pdfBuffer.toString("base64"),
                        filename: "Certificate.pdf",
                        type: "application/pdf",
                        disposition: "attachment",
                
                    }],
                    html:  HTMLContent,
                    
                    };
                    const msgBool= msg;
                    if(msgBool)
                    {
                        console.log('msg is created')
                    }
                    else
                    {
                        console.log('msg is not created')
                    }
                    //ES6
                    sgMail
                    .send(msg)
                    .then(() => {}, error => {
                        console.error(error);
    
                        if (error.response) {
                        console.error(error.response.body)
                        }
                    });
                    //ES8
                    /*(async () => {
                    try {
                        await sgMail.send(msg);
                    } catch (error) {
                        console.error(error);
    
                        if (error.response) {
                        console.error(error.response.body)
                        }
                    }
                    })();*/
                }
                const MailBool = sendPDF(Email);
                if(MailBool)
                {
                    console.log('Mail Sent');
                }
                else
                {
                    console.log('Some problem occured wile sending the mail');
                }
                //Bool giving true but message not arriving
                res.status(200).send('The certificate is stored in blockchain,db and the mail is sent')
            }
        })
    })


    app.post('/verifyMarksheet',async(req,res)=>{
        const {name,Rollno,Email,Mark1,Mark2,Mark3,Mark4,Mark5} = req.body;
        //const Hash = Rollno.toString()+Mark1.toString()+Mark2.toString()+Mark3.toString()+Mark4.toString()+Mark5.toString();
        const Hash = '597025c6eb58efa4ffad35172360a56b';
        console.log(Hash);
        let data = await lms.RetrieveData(Rollno,{from:accounts[0]});
        console.log(data);
        console.log(data[1])
        console.log(typeof(Hash));
        console.log(typeof(data[1]));
        if(Hash == data[1])
        {
            console.log('The certificate is valid');
            res.status(200).send('Valid certificate')
        }
        else
        {
            console.log('Invalid certificate');
            res.status(401).send('Invalid certificate not found in blockchain')
        }
        /*let content = "";
        if(!req.files && !req.files.pdfFile)
        {
            res.status(400);
            res.send('pdf not found')
        }
        else
        {
            pdfParse(req.files.pdfFile).then(result =>{
                console.log(result.text)
                res.send(result.text)
                content = result.text;
                let contentArray = content.split(" ");
                let rollno = parseInt(contentArray[7]);
                let mark1 = contentArray[10];
                let mark2 = contentArray[13];
                let mark3 = contentArray[16];
                let mark4 = contentArray[19];
                let mark5 = contentArray[22];
                // console.log(`${rollno} = ${mark1} = ${mark2} = ${mark3} = ${mark4} = ${mark5}`);
                let totContent = rollno + mark1 + mark2 + mark3 + mark4 + mark5;
                console.log(totContent)
                let hash = SHA256(totContent)
                console.log(hash);
                // compare the hash if same res.send(true)
            })
        }*/
        
    
    })


}
module.exports = routes