const User=require("../models/User")
const mailsender = require("../utilities/mail")
const bcrypt=require("bcrypt")
exports.resetPasswordToken=async(req,res)=>{
    try {
        //GET EMAIL FROM REQ BODY
        const email=req.body.email
        //EMAIL VALIDATION
        if(!email){
            return res.json({
                message:"email is missing"
            })
        }
        //EMAIL VERIFICATION FROM DB
        const user=await User.findOne({email})
        if(!user){
            return res.json({
                success:false,
                message:"you're not a valid user"
            })
        }
        const token=crypto.randomUUID()
        //EMAIL DB VERFICATION
        const updatedDetails=await User.findOneAndUpdate({email},{$set:{resetToken:token,
            resetTokenExpiryTime:Date.now()+10*60*1000}},{new:true})
        //UPDATE USER MODEL WITH TOKEN AND EXPIRY TIME
        //CREATE URL
        const url=`http://localhost:3000/update-password/${token}`
        //SEND OTP TO EMAIL 4
        await mailsender(email,"change password link",`You can change your via this link --> <a href="${url}">${url}</a>`)
        //SEND RESPONSE
        return res.json({
            success:true,
            message:"Change password link send successfully"
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Response from server: Unable to send Email'
        })
    }
}

exports.resetPassword=async(req,res)=>{
    try {
        const {pass,confirmPass,token}=req.body
        console.log(req)
        if(!pass||!confirmPass){
            return res.json({
                success:false,
                message:"all field must be filled"
            })
        }
        if(pass!==confirmPass){
            return res.json({
                success:false,
                message:"password doesn't match with confirm password"
            })
        }
        const user=User.findOne({token})
        if(!user){
            return res.json({
                success:false,
                message:"invalid token"
            })
        }
        if(user.tokenExpiryTime<Date.now()){
            return res.json({
                success:false,
                message:"token expired"
            })
        }
         let hashPass
            try {
                 hashPass=await bcrypt.hash(pass,10)
            } catch (error) {
                console.log(error.message)
            }
         const updated_user=await User.findOneAndUpdate({resetToken:token},{$set:{password:hashPass}},{new:true})
        
            return res.json({
                success:true,
                message:"user credential updated",
                data:updated_user
            })
            
    } catch (error) {
        return res.json({
            success:false,
            message:"error while resenting the password",
            error:error.message
        })
    }
}