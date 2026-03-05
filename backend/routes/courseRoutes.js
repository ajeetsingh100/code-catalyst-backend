const express=require("express")
const router=express.Router();
const {  createCourse,  getAllCourse,  getCourseDetails,  
    getFullCourseDetails,  editCourse,  getInstructorCourses,  deleteCourse,
    loadCourse,getInstructorStat} = require("../controller/Course")
const {  getAllCategory,  createCategory,   getCategoryDetails,getCategoryPageDetails} = require("../controller/Category")
const {  createSection,  updateSection,  deleteSection,} = require("../controller/Section")
const {  createSubSection, 
    updateSubSection,  deleteSubSection,} = require("../controller/SubSection")
const {  createRating,  getAverageRating,  getAllRating, checkUserReview, getUserReview, updateUserReview,} = require("../controller/RatingAndReview")
const { auth, isInstructor, isStudent, isAdmin } = require("../middlewares/auth")
const {  updateCourseProgress,checkUserProgress} = require("../controller/courseProgress");


// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can Only be Created by Instructors
router.post("/create-course", auth, isInstructor, createCourse)
//Add a Section to a Course
router.post("/add-section", auth, isInstructor, createSection)
// Update a Section
router.put("/update-section", auth, isInstructor, updateSection)
// Delete a Section
router.delete("/delete-section", auth, isInstructor, deleteSection)
// Edit Sub Section
router.put("/update-sub-section", auth, isInstructor, updateSubSection)
// Delete Sub Section
router.delete("/delete-sub-section", auth, isInstructor, deleteSubSection)
// Add a Sub Section to a Section
router.post("/add-sub-section", auth, isInstructor, createSubSection)
// Get all Registered Courses
router.get("/get-all-courses", getAllCourse)
// Get Details for a Specific Courses
router.post("/get-course-details", getCourseDetails)
// Get Details for a Specific Courses
router.post("/get-full-course-details", auth, getFullCourseDetails)
// Edit Course routes
router.post("/edit-course", auth, isInstructor, editCourse)
// Get all Courses Under a Specific Instructor
router.get("/get-instructor-courses", auth, isInstructor, getInstructorCourses)
// Delete a Course
router.delete("/delete-course",auth,isInstructor, deleteCourse)
router.post("/update-course-progress", auth, isStudent, updateCourseProgress);
router.post('/load-course',auth,isInstructor,loadCourse)
router.get('/get-instructor-stat',auth,isInstructor,getInstructorStat)
router.post("/check-user-progress",auth,isStudent,checkUserProgress)
// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************
// Category can Only be Created by Admin
// TODO: Put IsAdmin Middleware here
router.post("/create-category", auth, isAdmin, createCategory)
router.get("/show-all-categories", getAllCategory)
router.post("/get_category_details",getCategoryDetails)
router.post('/get-category-page-details',getCategoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************
router.post("/createRating", auth, isStudent, createRating)
router.get("/getAverageRating", getAverageRating)
router.get("/getReviews", getAllRating)
router.post('/check-user-review',auth,isStudent,checkUserReview)
router.post('/update-user-review',auth,isStudent,updateUserReview)


module.exports=router