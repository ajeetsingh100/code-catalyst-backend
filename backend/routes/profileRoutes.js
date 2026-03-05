const express=require("express")
const router=express.Router();
const {updateProfile,deleteUser,getUserDetails,getEnrolledCourses,instructorDashboard,updateDisplayPicture}=require('../controller/Profile')
const {auth,isInstructor}=require('../middlewares/auth')

router.delete("/delete-profile",auth, deleteUser)
router.put("/update-profile", auth, updateProfile)
router.get("/get-user-details", auth, getUserDetails)
router.get("/get-enrolled-courses", auth, getEnrolledCourses)
router.put("/update-display-picture", auth, updateDisplayPicture)
router.get("/instructor-dashboard", auth, isInstructor, instructorDashboard)

module.exports=router