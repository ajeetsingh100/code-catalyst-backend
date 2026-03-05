const User=require("../models/User")
const Profile=require('../models/Profile')
const { uploadToCloudinary } = require("../utilities/fileUploaderCloudinary");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");
const { convertSecondsToDuration } = require("../utilities/secToDuration");
function isNotFound(msg,res)
{
    return res.status(401).json({
       
        message:`${msg}`
    })
}
function internalServerError(msg,error,res)
{
    return res.status(500).json({
        success:false,
        message:`${msg}`,
        error:`${error.message}`
    })
}
//HANDLER FOR UPDATING A PROFILE
exports.updateProfile=async(req,res)=>{
    try {
        const {firstName,lastName,gender,contactNo,dateOfBirth="",about=""}=req.body
        const userID=req.user.id
        if(!firstName||!lastName||!contactNo||!gender||!userID)
        {
            isNotFound("All fields are required",res)
        }
        const user=await User.findById(userID)
        console.log(user.additionalDetails)
        await Profile.findByIdAndUpdate(user.additionalDetails,{$set:{gender,dateOfBirth,about,contactNo}})
        await User.findByIdAndUpdate(userID,{$set:{firstName,lastName}})
        const updatedUser=await User.findById(userID).populate("additionalDetails")
        
        
        res.status(200).json({
            success:true,
            message:"Profile update successfully",
            updatedUser
        })
    
    } catch (error) {
        internalServerError("Error while updateing profile",error,res)
    }

}
//HANDLER FOR DELETING A USER
exports.deleteUser=async(req,res)=>{
    try {
        const userID=req.body.id
        
        const userDetails=await User.findById(userID)
        if(!userDetails){
            isNotFound("Not userID found",res)
        }
        await Profile.findByIdAndDelete(userDetails.additionalDetails)
        await User.findByIdAndDelete(userID)
        res.status(200).json({
            message:"user deleted successfully"
        })
    
    } catch (error) {
        internalServerError("Error while deleting user",error,res)
    }
}
//HANDLER FOR FETCHING ALL USER
exports.getUserDetails=async(req,res)=>{
    try {
        const userID=req.user.id
        const userDetails=await User.findById(userID).populate("additionalDetails").populate({
            path:'courses',
            populate:{
                path:"category"
            }
        })
        
        return res.status(200).json({
            success:true,
            message:"All user successfully fetched",
            userDetails
        })
    } catch (error) {
        internalServerError("Error while listing all user",res)
    }
}

//UPDATE USER PROFILE PICTURE
exports.updateDisplayPicture = async (req, res) => {
    try {
      
      const displayPicture=req.files.displayPicture
      console.log(displayPicture)
      const userId = req.user.id
      const image = await uploadToCloudinary(
        displayPicture,
        'imageDB',
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      ).populate('additionalDetails')
      res.status(200).json({
        success: true,
        message: `Image Updated successfully`,
        updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

//GET ENROLLED COURSE
exports.getEnrolledCourses = async (req, res) => {
    try {
      
      const userId = req.user.id
 
      let userDetails = await User.findOne({
        _id: userId
      })
      .populate({
        path: "courses",
        populate: {
        path: "courseSection",
        populate: {
          path: "subSection",
        },
        },
      })
      .exec()
      
      console.log("userdetails",userDetails)
      userDetails = userDetails.toObject()
      //FINDING TOTAL VIDEOS IN A COURSE AND TOTAL COURSE DURATION
  for (let course of userDetails.courses){
      let totalCourseDuration=0
      let subSectionLength=0
      for( let section of course.courseSection)   
              //TOTAL DURATION         
              { totalCourseDuration+=
              section.subSection.reduce((acc,subSection)=>acc+parseInt(subSection.timeDuration),0)    
              //TOTAL VIDEOS        
              subSectionLength+=section.subSection.length
              }
              //SETTING NEW FIELD [TOTAL DURATION]
              course.totalDuration=convertSecondsToDuration(totalCourseDuration)
              //CAN BE OPTIMIZED USING PROMISE ALL
              let courseProgress=await CourseProgress.findOne({
              courseId: course._id,
              userId: userId,
          })
          let completedVideo=courseProgress?.completedVideos.length || 0
          if(subSectionLength===0){
              //SETTING NEW FIELD [PROGRESS PERCENTAGE]
              course.progressPercentage=100
          }else{
              course.progressPercentage=Math.round((completedVideo/subSectionLength)*10000)/100
          }
      }

      if (!userDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find user with id: ${userDetails}`,
        })
      }
      return res.status(200).json({
        success: true,
        courses: userDetails.courses,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
};

//INSTRUCTOR DASHBOARD
exports.instructorDashboard = async(req, res) => {
	try{
		const courseDetails = await Course.find({instructor:req.user.id});
    
		const courseData  = courseDetails.map((course)=> {
			const totalStudentsEnrolled = course.studentEnrolled.length
			const totalAmountGenerated = totalStudentsEnrolled * course.price

			//create an new object with the additional fields
			const courseDataWithStats = {
				_id: course._id,
				courseName: course.courseName,
				courseDescription: course.courseDescription,
				totalStudentsEnrolled,
				totalAmountGenerated,
			}
			return courseDataWithStats
		})

		res.status(200).json({courses:courseData});

	}
	catch(error) {
		console.error(error);
		res.status(500).json({message:"Internal Server Error"});
	}
}