const otpGenerator=require('otp-generator')
const User=require("../models/User")
const OTP=require('../models/OTP')
const bcrypt=require("bcrypt")
const Profile=require('../models/Profile')
const jwt=require("jsonwebtoken")
const mailsender = require('../utilities/mail')
require('dotenv').config()
exports.otp=async(req,res)=>{
   try {    
    //FETCHING EMAIL FROM REQUEST BODY
     const email=req.body.email
     //CHECKING IF USER ALREADY EXIST
     const userExist= await User.findOne({email})
     if(userExist){
         return res.status(401).json({
             success:false,
             message:"user already exist"
         })
     }
     //GENERATING OTP
     let otp=otpGenerator.generate(6,{
         lowerCaseAlphabets:false,
         upperCaseAlphabets:false,
         specialChars:false
     })
     //CHECKING IF THE GENERATED IS UNIQUE
     let uniqueOTP=await OTP.findOne({otp})
     while(uniqueOTP){
         otp=otpGenerator.generate(6,{
             upperCaseAlphabets:false,
             lowerCaseAlphabets:false,
             specialChars:false
         })
         
         uniqueOTP=await OTP.findOne({otp})
     }
     //SAVING OTP IN DB AND SENDING OTP TO EMAIL(USING PRE MIDDLEWARE) 
     const saved_otp=await OTP.create({email,otp})
     return res.status(200).json({
            success:true,
            message:"otp send successfully"
     })
   } catch (error) {
        return res.status(500).json({
            success:false,
            message:"error while sending otp",
            error:error.message
        })
   }

}

exports.signup= async (req,res)=>{
   try {
     //FETCHING DATA FROM REQUEST BODY
     const {firstName,lastName,email,password,confirmPassword,accountType,otp}=req.body
     console.log(req.body)
     //CHECKING FOR MISSING FIELD
     if(!firstName||!lastName||!email||!confirmPassword||!password||!otp){
          return res.status(401).json({
             success:false,
             message:"all field must filled "
         })
     }    
     
     //CHECKING PASSWORD AND CONFIRM PASSWORD IS SAME
     if(password!==confirmPassword){
         return res.status(401).json({
             success:false,
             message:"password and confirm password doesn't match"
         })
     }
     //FETCHING LATEST OTP FROM DB
     const recentOtp= await OTP.findOne({email})
     //CHECKING IF OTP NOT FOUND
     if(!recentOtp){
        return res.status(401).json({
            success:false,
            message:"No otp found"
        })
     }
     //CHECKING USER ENTERTED OTP IS SAME AS GENERATED ONE
     if(parseInt(otp)!==recentOtp.otp){
        return res.status(401).json({
                success:false,
                message:"entered otp is incorrect"
            })
     }
     //HASHING THE PASSWORD
     let hashPassword
    try {
      hashPassword= await bcrypt.hash(password,10)
    } catch (error) {
      console.log("error while hashing the password")
    }
    //CREATING USER PROFILE(MODEL=PROFILE)
    const userProfile=await Profile.create({
        gender:null,
        dateOfBirth:null,
        contactNo:null,
        about:null
    })
    //SAVING RECORD TO DB(MODEL-USER)
    const savedUser= await User.create({
     firstName,
     lastName,
     email,
     password:hashPassword,
     accountType,
     additionalDetails:userProfile._id,
     image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
    })
    //SENDING SUCCESS RESPONSE
    return res.status(200).json({
     success:true,
     message:'user record is created',
     data:savedUser
    })
   } catch (error) {
    return res.status(500).json({
        success:false,
        message:'unable to register user',
        data:error.message
    })
   }
}

exports.login= async (req,res)=>{
    try {
        //GET DATA FROM REQ BODY
        const {email,password}=req.body
        
        //DATA VALIDATION
        if(!email||!password){
            return res.status(401).json({
                message:"all field must be filled"
            })
        }
        //CHECKING IF USER EXIST OR NOT
        const user=await User.findOne({email}).populate('additionalDetails')
        if(!user){
            return res.status(400).json({
                message:"user not exist"
            })
        }
        //COMPARING PASSWORD
        const match=await bcrypt.compare(password,user.password)
        if(!match){
            return res.status(403).json({
                message:"invalid credentials"
            })
        }
        //GENERATE TOKEN
        const payload={
            email:user.email,
            id:user._id,
            role:user.accountType
        }
        const token=jwt.sign(payload,process.env.JWT_SECRET,{
            expiresIn:"10h"
        })
        //CREATE TOKEN AND SEND IT USING COOKIE

        return res.cookie("token", token, {
                    maxAge: 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    secure: true,
                    sameSite: "none"
                    })
                    .status(200)
                    .json({
                    success:true,
                    message:"user logged in successfully",
                    token,
                    user
                    })
    } catch (error) {
        return res.status(500).json({
            success:false,
            error:error.message,
            message:"unable to login"
        })
    }
}

exports.changePassword=async(req,res)=>{

    //GET OLD PASSWORD,NEWPASSWORD,CONFIRM PASSWORD
     try {
        const {newPass,confirmPass}=req.body
        const user=req.user
       //VALIDATION
       if(!newPass||!confirmPass){
           return res.json({
               message:"all field must be filled"
           })
       }
       //CHECKING ENTERED PASSWORD AND CONFIRM PASSWORD IS SAME OR NOT
       if(newPass!==confirmPass){
           return res.json({
               message:"new password and confirm password doesn't match"
           })
       }
       //HASHING THE PASSWORD
       let hashPass
       try {
            hashPass=await bcrypt.hash(newPass,10)
       } catch (error) {
           console.log(error.message)
       }
       //DECODING THE TOKEN
       
       //FETCHING THE USER DETAILS
       const updatedUser=await User.findOneAndUpdate({email:user.email},{$set:{password:hashPass}},{new:true}).populate('additionalDetails')
       //SENDING THE MAIL TO USER
       // mailsender(user.email,"change password request",`congratulation your password of
       //                                              studynotion account has been changed`)
       //RETURNING SUCCESS RESPONSE
       return res.status(200).json({
           message:"password changed successfully!!",
           updatedUser
       })
     } catch (error) {
        return res.status(500).json({
            message:error.message,
            data:error.message
        })
     }
    
}