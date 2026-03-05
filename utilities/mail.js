const nodemailer=require("nodemailer")
require("dotenv").config()

const mailsender=async(email,title,body)=>{
    try{
        let transporter=nodemailer.createTransport({
            host:process.env.MAIL_HOST,
            auth:{
                user:process.env.MAIL_USER,
                pass:process.env.MAIL_PASS
            }
        })
        let info=await transporter.sendMail({
            from:"StudyNotion || Ajeet Singh CEO",
            to:`${email}`,
            subject:`${title}`,
            html:`${body}`,
        })
        console.log(info)
    }catch(error){
        console.log("error while sending mail\n",error)
    }
}
module.exports=mailsender