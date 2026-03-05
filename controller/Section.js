const Section=require("../models/Section")
const Course=require("../models/Course")
const SubSection = require("../models/SubSection")

//UTILITY FUNCTION
function isNotFound(msg,res){
    return res.status(404).json({
        success:false,
        message:`${msg}`
    })
}
function catchError(msg,error,res){
    return res.status(500).json({
        success:false,
        message:`${msg}`,
        error:error.message
    })
}
//HANDLER FOR CREATING SECTION
exports.createSection=async(req,res)=>{
    try {
        //DATA FETCH
        const {sectionName,courseID}=req.body
        //DATA VALIDATION
        if(!sectionName)
        {
            isNotFound("section name is empty",res)
        }
        //CREATE SECTION
        const sectionCreated=await Section.create({sectionName})
        //UPDATE TO COURSE
        const updatedCourse=await Course.findByIdAndUpdate(
            courseID,
            {$push:{courseSection:sectionCreated._id}},
            {new:true})
            .populate({
                path:'courseSection',
                populate:{
                    path:'subSection'
                }
            })
        //RETURN RESPONSE
        return res.status(200).json({
            success:true,
            message:"Section created successfully",
            sectionCreated,
            updatedCourse
        })
    } catch (error) {
        catchError("Error while creating course section",error,res)        
    }

}
//HANDLER FOR UPDATING SECTION
exports.updateSection=async(req,res)=>{
    try {
        //FETCHING DATA
        const {sectionName,sectionID,courseID}=req.body
        //VALIDATING DATA
        if(!sectionName||!sectionID){
            isNotFound("All fields must be filled ",res)
        }
        //UPDATING SECTION
        const updatedSection=await Section.findByIdAndUpdate(sectionID,{$set:{sectionName:sectionName}},{new:true})
        const updatedCourse=await Course.findById(courseID).populate({
                path:'courseSection',
                populate:{
                    path:'subSection'
                }
            })
        //RETURNING SUCCESS RESPONSE
        return res.status(200).json({
            success:true,
            message:"Section updated successfully",
            updatedCourse
        })
    } catch (error) {
        catchError("Error while updating section",error,res)
    }
}
//HANDLER FOR DELETING SECTION
exports.deleteSection=async(req,res)=>{
    try {
        //FETCHING DATA
        const {courseID,sectionID}=req.body
        //VALIDATING DATA
        if(!sectionID){
            isNotFound("sectionID is not found ",res)
        }
        //DELETING SUB-SECTION AND SECTION
        const section=await Section.findById(sectionID)
        if(section){
            if(section.subSection.length!==0){
                for(  let subSection of section.subSection){
                    await SubSection.findByIdAndDelete(subSection)              
                }
            }            
            await Section.findByIdAndDelete(section._id)
        }
        
        //UPDATING COURSE SECTION IN COURSE MODEL
        const updatedCourse=await Course.findByIdAndUpdate(courseID,{$pull:{courseSection:sectionID}},{new:true})
        .populate({
            path:'courseSection',
            populate:{
                path:"subSection"
            }
        })
        //RETURNING SUCCESS RESPONSE
        return res.status(200).json({
            success:true,
            message:"Section deleted successfully",
            updatedCourse
        })
    } catch (error) {
        catchError("Error while updating section",error,res)
    }
}