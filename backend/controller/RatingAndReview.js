const Course = require("../models/Course")
const RatingAndReviews=require("../models/RatingAndReviews")
const mongoose=require("mongoose")

//createRating
exports.createRating=async(req,res)=>{
    try {
        //FETCHING USERID,COURSEID,REVIEW AND RATING
        const {review,rating,courseID}=req.body
        let userID=req.user.id

        //IS USER ENROLLED IN COURSE BEFORE RATING AND REVIEWING THE COURSE
        const courseFetched=await Course.findById(courseID)
        const alreadyReviewed=await RatingAndReviews.findOne({
            course:courseID,
            user:userID
        })
             
        if(courseFetched.studentEnrolled.includes(userID))
        {
            if(alreadyReviewed){
                return res.status(400).json({
                    success:false,
                    message:"You have already rated or reviewed this course"
                })
            }else{
                const savedRatingAndReview=await RatingAndReviews.create({
                    rating,
                    review,
                    user:userID,
                    course:courseID
                })
                const updatedCourse=await Course.findByIdAndUpdate(courseID,{$push:{ratingAndReviews:savedRatingAndReview._id}},{new:true})
                return res.status(200).json({
                    success:true,
                    message:"Successfully submitted your review and rating",
                    updatedCourse
                })
            }
        }else{
            return res.status(400).json({
                success:false,
                message:"Since you're not enrolled in this course you're not eligible to rate or review it"
            })
        }

        
    } catch (error) {
        return res.status(500).json({
            message:"Error while creating rating and review",
            error:error.message
        })
    }
}
//getAverageRating
exports.getAverageRating=async(req,res)=>{
     try {
        const courseID=req.body.courseID
        const result=await RatingAndReviews.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseID)
                }
            },
            {
                $group:{
                    _id:null,
                    avgRating:{$avg:"$rating"}
                }
            }
        ])
        if(result.length>0)
        {
            return res.status(200).json({
                data:result[0].avgRating
            })
        }

            return res.status(200).json({
                message:"No rating and review found the course till now"
            })
        
        
    } catch (error) {
        return res.status(500).json({
            message:"Error while fetching average rating and review",
            error:error.message
        })
    }
}
//getAllRating
exports.getAllRating=async(req,res)=>{
     try {
        const courseID=req.body.courseID
        const allRatingReview=await RatingAndReviews.find({course:courseID})
                                                         .sort({rating:-1})
                                                         .populate({
                                                            path:"user",
                                                            select:"firstName lastName email image"
                                                         })
                                                         .limit(5)
        return res.status(200).json({
            success:true,
            message:"All rating fetched successfully",
            data:allRatingReview,
        })
    } catch (error) {
        return res.status(500).json({
            message:"Error while fetching all rating and review",
            error:error.message
        })
    }
}

exports.checkUserReview=async(req,res)=>{
    const {courseID}=req.body
    try {
         const course=await Course.findById(courseID).populate('ratingAndReviews')
         return res.status(200).json({
            review:course.ratingAndReviews,
            message:'review status checked successfully'
         })
    } catch (error) {
        return res.status(500).json({
            message:'error while fetching rating status',
            error:error.message
        })
    }
    
}

exports.updateUserReview=async(req,res)=>{
    const {courseID,rating,review}=req.body
    const userID=req.user.id
    if(!courseID||!rating||!review){
        return res.status(404).json({
            success:false,
            message:'required fields are missing'
        })
    }
    try {
        const ratingAndReview=await RatingAndReviews.findOneAndUpdate({
            course:courseID,
            user:userID
        },{$set:{rating:rating,review:review}})

        return res.status(200).json({
            success:true,
            message:'User review updated successfully'
        })
    } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Error while updating user review'
        })
    }
}
