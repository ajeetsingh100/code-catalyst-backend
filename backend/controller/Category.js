const Category=require('../models/Category')
const Course = require('../models/Course')
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

//UTILIITES FUNCTIONS
function validateInput(){
    res.status(401).json({
        message:"all fields are required"
    })
}
exports.createCategory=async(req,res)=>{
    try {
        //DESTRUCTURING INPUT
        const {categoryName,description}=req.body
        //VAILDATING INPUT
        if(!categoryName||!description){
            validateInput()
        }
        const saved_Category=await Category.create({
            categoryName,
            description
        })
        console.log(`//*****SAVED Category DETAILS*****//\n ${saved_Category}`)
        res.status(200).json({
            success:true,
            message:"Categorys successfully created"
        })
    } catch (error) {
        res.status(500).json({
            error:error.message,
            message:"error while creating Categorys"
        })
    }
}

exports.getAllCategory=async(req,res)=>{
    try {
        const allCategory=await Category.find()
        console.log(`//*****ALL CategoryS*****//\n ${allCategory}`)
        return res.status(200).json({
            success:true,
            message:"successfully fetched all Categorys",
            allCategory
        })
    } catch (error) {
        return res.status(500).json({
            error:error.message,
            message:"error while creating Categorys"
        })
    }
}

exports.getCategoryDetails=async(req,res)=>{
    try {
        const categoryID=req.body.categoryID
        const categoryDetails=await Category.find({_id:categoryID})
                                             .populate("course")
                                           
        if(!categoryDetails){
            return res.status(404).json({
                message:"No coure found for the given category"
            })
        }                                     
        const differentCategoryCourse=await Category.find({_id:{$ne:categoryID}})
                                                   .populate("course")
        return res.status(200).json({
            message:"category details fetched successfully",
            categoryDetails,
            differentCategoryCourse
        })
        
    } catch (error) {
        return res.status(500).json({
            message:'Error while fetching category details',
            error:error.message
        })
    }
}
exports.getCategoryPageDetails=async(req,res)=>{
    console.log(req)
    try {
        const {categoryID}=req.body
        const categoryCourses=await Category.find({_id:categoryID,courses:{$not:{$size:0}}})
        .populate({
            path:'courses',
            match:{status:'published'},
            populate:[
                {
                path:'ratingAndReviews',
                },
                {
                    path:"instructor"
                }
        ],
            
        })        
        if(categoryCourses.length===0){
            return res.status(404).json({
                message:'No courses found for the selected course'
            })
        }
       
        
        /***** filtering courses of selected category *****/ 
        const allCourses=categoryCourses.flatMap(category=>category.courses)
        //const popularCourses=allCourses.sort((a,b)=>a.studentEnrolled.length-b-studentEnrolled.length).slice(0,10)
        //const newCourses=allCourses.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt)).slice(0,10)

        /* fetching different category courses */
        const differentCategory= await Category.find({_id:{$ne:categoryID},courses:{$not:{$size:0}}}).populate({
            path:'courses',
            match:{status:'published'},
            populate:{
                path:'ratingAndReviews'
            }
        })
        const differentCategoryCourses=differentCategory[getRandomInt(differentCategory.length)]
               
        /*fetching only popular courses */
        const mostSellingCourses=await Course.find({status:'published'}).populate('ratingAndReviews') 

        return res.status(200).json({
            allCourses,
            mostSellingCourses,
            differentCategoryCourses
        })
                      
    } catch (error) {
        return res.status(500).json({
            message:'Error while fetching category page details',
            data:error.message
        })        
    }
}
/* Important point
   ==================

    findById arg: You can pass id with any name because it will convert and call
                    findById(user_id)=>  findOne({_id:user_id})
                    
    findOne: It is necessary for the first arg to be passed query object means
             findOne(id)  --> invalid
             findOne({id}) --> internally findOne({id:id}) --> return null
             findOne({_id}) --> returns requested record

    Note: ObjectId that travel throught request object is of string type and mongodb internally converts it to
          ObjectID

    */