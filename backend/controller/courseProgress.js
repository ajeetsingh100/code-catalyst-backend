const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");
const mongoose=require("mongoose")

exports.updateCourseProgress = async (req,res) => {
    let {courseID, subSectionID} = req.body;
    let userId = req.user.id
    console.log(courseID,userId)
    try {
        const subSection = await SubSection.findById(subSectionID);
        if(!subSection){
            return res.status(404).json({
                error:"Invalid SubSection"
            })
        }
        
        let courseProgress = await CourseProgress.findOne({
            courseId:new mongoose.Types.ObjectId(courseID),
            userId: new mongoose.Types.ObjectId(userId)
        })
        
        
        if (!courseProgress) {
            return res.status(404).json({
                error:"Course Progress does not exist"
            })
        }
        else{
            if (courseProgress.completedVideos.includes(subSectionID)) {
                return res.status(200).json({
                    success:false,
                    message:"Video already completed"
                })
            }

            courseProgress.completedVideos.push(subSectionID);
            console.log("Course Progress Push Done");
        }
        await courseProgress.save();
        console.log("Course Progress Save call Done");
        return res.status(200).json({
            success:true,
            message:"Course Progress Updated Successfully",
        })
    } catch (error) {
        console.error(error);
        return res.status(400).json({error:"Internal Server Error"});
    }
}

exports.checkUserProgress=async(req,res)=>{
    let {courseID, subSectionID} = req.body;
    let userId = req.user.id

   try {
        let courseProgress = await CourseProgress.findOne({
                courseId:new mongoose.Types.ObjectId(courseID),
                userId: new mongoose.Types.ObjectId(userId)
            })
        subSectionID=new mongoose.Types.ObjectId(subSectionID)
        if(courseProgress.completedVideos.includes(subSectionID)){
            return res.status(200).json({
                progressExist:true,
                message:"video is already marked"
            })
        }
        else{
            return res.status(200).json({
                progressExist:false,
                message:"video is not marked"
            })
        }
        
   } catch (error) {
        return res.status(500).json({
            success:false,
            message:'Error while checking user progress'
        })
   }
}