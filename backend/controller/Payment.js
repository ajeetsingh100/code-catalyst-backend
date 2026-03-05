const {instance}=require("../config/razorpay")
const User=require("../models/User")
const Course=require("../models/Course")
const mailsender=require("../utilities/mail")
const { default: mongoose } = require("mongoose")
const CourseProgress = require("../models/CourseProgress")
const crypto=require('crypto')
require("dotenv").config()

exports.capturePayment=async(req,res)=>{
    console.log('request body in capture payment',req.body)
    try {
        const {courses}=req.body
        const userID=req.user.id
        let totalCoursePrice=0

        //VALIDATING INPUT
        if(courses.length==0){
            return res.status(400).json({
                success:false,
                message:'Please provide atleast one course'
            })}

        if(!userID){
            return res.status(400).json({
                success:false,
                message:'userID is empty'
            })}
        
        const user=await User.findById(userID)
        for( let course of courses){
            //CHECKING COURSE EXISTENCE
              const selectedCourse=await Course.findById(course._id)
              if(!selectedCourse){
                return res.status(404).json({
                    success:false,
                    message:'selected is not found '
                })            
              }  
              //CHECHKING STUDENT ALREADY ENROLLED IN THE BUYING COURSE              
                if(user.courses.includes(selectedCourse._id)){
                    return res.status(500).json({
                        success:false,
                        message:`You're already enrolled in ${selectedCourse.courseName} please remove it from cart or check your enrolled section!!!`
                    })
                }
            //IF NOT ALREADY ENROLLED THEN CALCUALTE PRICE
            totalCoursePrice+=selectedCourse.price
        }
        const options={
            amount:`${totalCoursePrice*100}`,
            currency:'INR',
            receipt:`order_${Date.now()}`,
        }
        const orderResponse=await instance.orders.create(options)
        return res.status(200).json({
            success:true,
            message:"Order is successfully placed",
            orderResponse
        })
            
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Error while creating order',
            message:error.message
        })
    }
}

const enrollStudent=async(courses,userID)=>{
    
    try {
        if(courses.length==0||!userID){
            throw new Error('course or userID is missing')
        }
        userID= new mongoose.Types.ObjectId(userID)
        for (let course of courses){
           
            const updatedCourse=await Course.findByIdAndUpdate(course._id,{$push:{studentEnrolled:userID}},{new:true})
            const updatedCourseProgress=await CourseProgress.create({
                courseId:updatedCourse._id,
                userId:userID,
                completedVideos:[]
            })
            const updatedUser=await User.findByIdAndUpdate(userID,{$push:{courses:updatedCourse._id,courseProgress:updatedCourseProgress._id}},{new:true})
                     
        }
        console.log('student enrolled successfully')
        return true
    } catch (error) {
        throw error
    }
}

exports.verifyPayment=async(req,res)=>{
    console.log('request body in verify payment',req.body)
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body
    const courses = req.body.courses;
    const userId = req.user.id;

    if(!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature || !courses || !userId) {
            return res.status(200).json({success:false, message:"fields are missing in verify payment function body"});
    }

    let body=razorpay_order_id+"|"+razorpay_payment_id
    const expectedSignature=crypto.createHmac('sha256',process.env.RAZORPAY_SECRET)
                                    .update(body.toString())
                                    .digest('hex')

    if(expectedSignature===razorpay_signature){
        console.log('payment is verified')
        try {
            const result=await enrollStudent(courses,userId)
            if(result){
                return res.status(200).json({
                    success:true,
                    message:"Payment is Verified, and Student is enrolled successfully "
                })
            }
        } catch (error) {
            return res.status(500).json({
                success:false,
                message:error.message
            })
        }
       
    }
}
exports.sendPaymentSuccessEmail = async (req,res) => {
    console.log(req.body)
    const {orderId, paymentId, amount} = req.body;


    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({success:false, message:"Please provide all the fields"});
    }

    try {
        const user = await User.findById(userId);
        await mailsender(
            user.email,
            `Payment Received`,
           `Thank You ${user.firstName+user.lastName} for purchasing our course. We have recieved your payment of ₹${amount/100} successfully with a order id ${orderId}`
        )

    } catch (error) {
        console.log("error in sending mail", error)
        return res.status(500).json({success:false, message:"Could not send email"})
    }
}


