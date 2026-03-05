const jwt=require('jsonwebtoken')
require('dotenv').config()

exports.auth=async(req,res,next)=>{
    const token=req.body?.token||req.cookies?.token||req.header("Authorization")?.replace("Bearer ","")
    console.log('token from body',req.body?.token)
    console.log('token from cookies',req.cookies?.token)
    console.log('hello token',token)
    if(!token){
        return res.json({
            message:"token is missing"
        })
    }
    let decoded_token
    try {
        console.log('before')
        decoded_token=jwt.verify(token,process.env.JWT_SECRET)
        console.log('after')
        req.user=decoded_token
    
    } catch (error) {
        return res.status(500).json({
            message:'cannot parse token'
        })
    }      
    next()
}

//IS_STUDENT HANDLER
exports.isStudent=(req,res,next)=>{
    console.log(req.user)
    if(req.user.role!='student')
    {
       return res.status(403).json({
            message:"This is a protected route for student"
        })
    }
    next()
}

//IS_INSTRUCTOR HANDLER
exports.isInstructor=(req,res,next)=>{
    
    if(req.user.role!='instructor')
    {
        return res.status(403).json({
            message:"This is a protected route for teacher"
        })
    }
    next()

}
//IS_ADMIN
exports.isAdmin=(req,res,next)=>{
    
    if(req.user.role!='admin')
    {
       return res.status(403).json({
            message:"This is a protected route for teacher"
        })
    }
    next()

}


