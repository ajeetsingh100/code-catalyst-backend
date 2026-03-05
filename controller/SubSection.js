const SubSection=require("../models/SubSection")
const Course=require('../models/Course')
const Section=require("../models/Section")
const { uploadToCloudinary } = require("../utilities/fileUploaderCloudinary")
//UTILITIES FUNCTION
function isNotFound(msg,res){
    return res.status(401).json({
        message:`${msg}`
    })
}
function internalServerError(msg,error,res)
{
    return res.status(500).json({
        success:false,
        message:`${msg}`,
        error:error.message
    })
}
exports.createSubSection=async(req,res)=>{
    try {
        //FETCHING DATA
        const {title,description,sectionID}=req.body
        const {video}=req.files
        
        //VALIDATING DATA
        if(!title||!description){
            isNotFound("all field must be filled",res)   
        }
        //CREATING SUBSECTION
        const videoFile=await uploadToCloudinary(video,'videoDB')
        const createdSubSection=await SubSection.create({
            title,
            description,
            videoUrl:videoFile.secure_url,
            timeDuration:`${videoFile.duration}`
        })
        //UPDATING SECTION
        const updatedSection=await Section.findByIdAndUpdate(sectionID,{$push:{subSection:createdSubSection._id}},{new:true}).populate("subSection")
        
        //RETURNING SUCCESS RESPONSE
        return res.status(200).json({
            success:true,
            message:"Subsection successfully created",
            createdSubSection,
            updatedSection,
        })
    } catch (error) {
        internalServerError("Error while creating subSection",error,res)
    }
}
/********************EXAMING THE CODE******************** */
exports.updateSubSection = async (req, res) => {
    try {
      const {courseID,subSectionID, title, description } = req.body
      const subSection = await SubSection.findById(subSectionID)
  
      if (!subSection) {
        return res.status(404).json({
          success: false,
          message: "SubSection not found",
        })
      }
  
      if (title !== undefined) {
        subSection.title = title
      }
  
      if (description !== undefined) {
        subSection.description = description
      }
      if (req.files && req.files.video !== undefined) {
        const video = req.files.video
        const videoFile = await uploadToCloudinary(
          video,
          process.env.FOLDER_NAME
        )
        subSection.videoUrl = videoFile.secure_url
        subSection.timeDuration = `${videoFile.duration}`
      }
  
      await subSection.save()
  
      const updatedCourse = await Course.findById(courseID).populate({
        path:'courseSection',
        populate:{
          path:'subSection'
        }
      })


      return res.json({
        success: true,
        updatedCourse,
        message: "Section updated successfully",
      })
    } catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the section",
      })
    }
  }
/********************EXAMING THE CODE******************** */
exports.deleteSubSection = async (req,res) =>{
    try {
      const {courseID,sectionID,subSectionID}=req.body
      if(!courseID||!sectionID||!subSectionID){
        return res.status(400).json({
          success:false,
          message:'courseID,sectionID or subSectionID is missing'
        })
      }
      await SubSection.findByIdAndDelete(subSectionID)
      await Section.findByIdAndUpdate(subSectionID,{$pull:{subSection:subSectionID}})
      const updatedCourse= await Course.findById(courseID).populate({
        path:'courseSection',
        populate:{
          path:'subSection'
        }
      })
      
      return res.json({
        success: true,
        updatedCourse,
        message: "SubSection deleted successfully",
      })
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:'Failed to delete SubSection',
            error: error.message,
        })
    }
}