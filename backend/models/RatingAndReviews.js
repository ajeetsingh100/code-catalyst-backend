const mongoose=require("mongoose")

const ratingAndReviewsSchema=new mongoose.Schema({
    rating:{
        type:Number,
        required:true
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    review:{
        type:String,
        required:true
    },
    course:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
        required:true
    }
})

module.exports=mongoose.model("RatingAndReviews",ratingAndReviewsSchema)