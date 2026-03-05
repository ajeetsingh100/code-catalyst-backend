const User=require("../models/User")
const Category=require("../models/Category")
const Course=require("../models/Course")
const Section=require('../models/Section')
const SubSection=require('../models/SubSection')
const { uploadToCloudinary } = require("../utilities/fileUploaderCloudinary")
const CourseProgress = require("../models/CourseProgress")
require('dotenv').config();
const { convertSecondsToDuration } = require("../utilities/secToDuration")

//UTILITIES FUNCTIONS
function validateInput(res){
    return res.status(401).json({
        message:"all fields are required"
    })
}
function isNotFound(msg,res){
    return res.status(404).json({
        message:`${msg}`
    })
}

//HANDLER TO CREATE COURSE
exports.createCourse=async(req,res)=>{
    try {
        //FETCHING RECORD
        const {courseName,courseDescription, whatYouWillLearn, price,category,status}=req.body
        const instructions=JSON.parse(req.body.instructions)
        const tags=JSON.parse(req.body.tags)
        console.log(req)
         //GET THUMBNAIL
        const thumbnail=req.files.thumbnail       
        //INPUT VALIDATION
        if(!courseName||!courseDescription||!whatYouWillLearn||!price||!category||!status||!tags||!instructions){
            validateInput(res)
        }
        //CHECK FOR INSTRUCTOR
        const instructorID=req.user.id
        console.log(`instructor id ${instructorID} is of ${typeof instructorID}`)
        //const instructor=await User.findById(instructorIdJWT)
        //VALIDATING TAG
        const fetchedCategory=await Category.findById(category)
        if(!fetchedCategory){ 
            isNotFound("Category with given ID not found",res)
        }
        //UPLOAD IMG TO CLOUDINARY
        const image=await uploadToCloudinary(thumbnail,"imageDB",90,250,400)
        //CREATE ENTRY FOR COURSE
        const courseCreated=await Course.create({
            courseName,
            courseDescription,
            price,
            whatYouWillLearn,
            instructor:instructorID,
            category:fetchedCategory._id,
            tags,
            instructions,
            thumbnail:image.secure_url,
            status

        })
        //UPDATE THE USER MODEL FOR ACCOUNT TYPE - INSTRUCTOR
        const updatedUser=await User.findByIdAndUpdate(instructorID,{$push:{courses:courseCreated._id}},{new:true})
        
        //UPDATE CATEGORY BY PUSHING NEWLY COURSE CREATED
        //FAQ:IT IS NECESSARY TO WRITE $SET OPR
        const updatedCategory=await Category.findByIdAndUpdate(fetchedCategory._id,{$push:{courses:courseCreated._id}},{new:true})
        //SENDING SUCCESS RESPONSE
        return res.status(200).json({
            message:"course successfully created",
            user:updatedUser,
            course:courseCreated,
            category:updatedCategory
        })
    } catch (error) {
        return res.status(500).json({
            message:"error while creating course",
            error:error.message,
            data:error.message
        })
    }
}
//HANDLER FOR FETCHING ALL COURSES
exports.getAllCourse=async(req,res)=>{
   try {
        const allCourses=await Course.find()
        if(!allCourses){
            isNotFound("Course collection is empty",res)
        }
        return res.status(200).json({
            success:true,
            message:"Successfully fetched all courses",
            data:allCourses
        })
   } catch (error) {
    return res.status(500).json({
        error:error.message,
        message:"Error while fetching all courses"
    })
   }    

}

exports.getCourseDetails=async(req,res)=>{
    try {
        //GET COURSE ID
        const {courseID}=req.body
        //FETCHING COURSE DETAILS 
        let courseDetails=await Course.findById(courseID)
                                                 .populate('category')
                                                // .populate("ratingAndReviews")
                                                 .populate({
                                                     path:"instructor",
                                                     populate:{
                                                        path:"additionalDetails"
                                                     }
                                                    })
                                                 .populate({
                                                    path:"courseSection",
                                                    populate:{
                                                        path:"subSection"
                                                    }
                                                 }).populate({
                                                  path:'ratingAndReviews',
                                                  populate:{
                                                    path:'user'
                                                  }
                                                 })
          let totalCourseDuration=0 
          courseDetails=courseDetails.toObject()                                      
          courseDetails.courseSection.forEach((section)=>{
          totalCourseDuration+=section.subSection.reduce((acc,subSection)=>acc+parseInt(subSection.timeDuration),0)
          totalSectionDuration=section.subSection.reduce((acc,subSection)=>acc+parseInt(subSection.timeDuration),0)
          section.totalSectionDuration= convertSecondsToDuration(totalSectionDuration)
        })
         const totalCourseDurationInSeconds=convertSecondsToDuration(totalCourseDuration)
        courseDetails.totalCourseLectures=courseDetails.courseSection.reduce((acc,section)=>acc+section.subSection.length,0)         
         courseDetails.totalCourseDuration=totalCourseDurationInSeconds
        //IF NOT FOUND
        if(!courseDetails){
            return res.status(400).json({
                message:"Course details not found"
            })
        }

        //SUCESS RESPONSE
        return res.status(200).json({
            success:true,
            message:'Course details fetched successfully',
            courseDetails
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"Error while fetching course details"
        })
    }
}

/*****************EXAMING THE CODE*******************/
exports.editCourse = async (req, res) => {
    try {
      const courseId= req.body.courseId
      const updates=JSON.parse(req.body.updates)
     
      const course = await Course.findById(courseId)
      
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnail
        const image = await uploadToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = image.secure_url
      }
  
      // Update only the fields that are present in the request body
     if (Object.keys(updates).length!==0) {
       for (const key in updates) {
         if (updates.hasOwnProperty(key)) {
           course[key] = updates[key]
         }
       }
     }
  
      await course.save()
  
      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails", 
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseSection",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }
  /*****************EXAMING THE CODE*******************/
  exports.getFullCourseDetails = async (req, res) => {
    try {
      const { courseId } = req.body
      const userId = req.user.id
      let courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseSection",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      let courseProgress = await CourseProgress.findOne({
        courseId: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgress)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }
      let totalDuration=0
      let totalCourseLectures=0
      courseDetails=courseDetails.toObject()
      courseDetails.courseSection.forEach((section)=>{
        totalDuration+=section.subSection.reduce((acc,subSection)=>acc+parseInt(subSection.timeDuration),0)
      })
      courseDetails.courseSection.forEach(section=>{
        totalCourseLectures+=section.subSection.length
      })
      courseDetails.totalCourseLectures=totalCourseLectures
      const totalDurationInSeconds = convertSecondsToDuration(totalDuration)
  
      return res.status(200).json({
        success: true,
        
          courseDetails,
          totalDurationInSeconds,
          completedVideos: courseProgress?.completedVideos
            ? courseProgress?.completedVideos
            : [],
       
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
    /*****************EXAMING THE CODE*******************/
  // Get a list of Course for a given Instructor
  exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id
  
      // Find all courses belonging to the instructor
      const allCourse = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 }).populate({
        path: "courseSection",
        populate: {
          path: "subSection",
        },
      })
      .exec()
        let totalDuration=0
      const instructorCourses = allCourse.map(course=>{
        totalDuration=0
        course=course.toObject()
        course.courseSection.forEach(section=>
          totalDuration=section.subSection.reduce((acc,subSection)=>acc+parseInt(subSection.timeDuration),0)
        )

        course.totalCourseDuration=convertSecondsToDuration(totalDuration)
        return course
      })
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }
  /*****************EXAMING THE CODE*******************/
  // Delete the Course
  exports.deleteCourse = async (req, res) => {
    try {
      const { courseID} = req.body
      const instructorID=req.user.id
  
      // Find the course
      const course = await Course.findById(courseID)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentEnrolled
      if(studentsEnrolled.length!==0){
        for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseID },
        })
      }
      }      
        //DELETING THE COURSE FROM INSTRUCTOR MODEL
        await User.findByIdAndUpdate(instructorID,{$pull:{courses:courseID}})
  
      // Delete sections and sub-sections
      const courseSections = course.courseSection
        for (const sectionId of courseSections) {
          // Delete sub-sections of the section
          const section = await Section.findById(sectionId)
          if (section) {
            const subSections = section.subSection
            for (const subSectionId of subSections) {
              //DELETING SUBSECTION 
              await SubSection.findByIdAndDelete(subSectionId)
            }
          }
        
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
      

      // Delete the course
      await Course.findByIdAndDelete(courseID)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }

exports.loadCourse=async(req,res)=>{
  const {courseID}=req.body
  if(!courseID){
    return res.status(401).json({
      success:false,
      message:"courseID is missing"
    })
  }
  try {
    const course=await Course.findById(courseID).populate({
      path:'courseSection',
          populate:{
            path:'subSection'
          }}   
    )
    if(!course){
      return res.status(404).json({
        success:false,
        message:'course not found'
      })
    }
    return res.status(200).json({
      success:true,
      message:'course successfully fetched',
      course
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      messsage:error.message
    })
    
  }
}
exports.getInstructorStat=async(req,res)=>{
  const userID=req.user.id
  try {
    const userDetails=await User.findById(userID)
  if(userDetails.courses.length!==0){
    const user=await User.findById(userID).populate('courses')
    return res.status(200).json({
      success:true,
      user,
      message:'user stat fetched successfully'
    })
    
  }
  return res.status(404).json({
      success:false,
      userDetails,
      message:'user have not created any course yet',
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:'something went wrong while fetching user statistics',
      error:error.message
    })
  }
}