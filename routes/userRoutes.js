const express=require("express")
const router=express.Router();
const {otp,login,signup,changePassword}=require("../controller/Auth")
const {auth}=require("../middlewares/auth")
const {resetPasswordToken,resetPassword}=require('../controller/ResetPasword')

router.post('/login',login)
router.post('/signup',signup)
router.post('/sendotp',otp)
router.post('/change-password',auth,changePassword)
router.post('/reset-password-token',resetPasswordToken)
router.post('/reset-password',resetPassword)
module.exports=router