const mongoose=require("mongoose")
const mailsender = require("../utilities/mail")

const otpSchema=new mongoose.Schema({
    email:{
        type:String,
    },
    otp:{
        type:Number,
    },
    createdAt:
        {
            type:Date,
            default:Date.now,
            expires:300
        }
    
})
//PRE MIDDLWARE FOR SENDIND MAIL WITH OTP
async function sendVerficatioMain(email,otp){
    try {
        const mailResponse=await mailsender(email,"verfication mail",otp)
        console.log("Email is sent successfully",mailResponse)
    } catch (error) {
        console.log("error while sending verfication mail",error)
    }
}
otpSchema.pre('save',async function(next){
    await sendVerficatioMain(this.email,this.otp)
    next();
})
module.exports=mongoose.model("OTP",otpSchema)