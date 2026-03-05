const express=require("express")
const cookieParser=require("cookie-parser")
require("dotenv").config()
const cors=require("cors");

//DB AND FILE CONFIGORATION
const dbConnect = require("./config/database");
const fileUpload=require('express-fileupload');
const connectWithCloudinary = require("./config/cloudinary");

//IMPORTING APP ROUTES
const userRoutes=require("./routes/userRoutes")
const profileRoutes=require("./routes/profileRoutes")
const paymentRoutes=require('./routes/paymentRoutes')
const courseRoutes=require('./routes/courseRoutes')

//AUTHENTICATION ROUTES
const {auth, isStudent}=require("./middlewares/auth")

const app=express();
//application/json() [for raw json]
app.use(express.json())
//application/x-www-urlencoded-form -[by default type of html forms]
app.use(express.urlencoded())
app.use(cookieParser())
app.use(cors({
    origin:"https://codecatalyst-frontend.vercel.app",
    credentials:true
}))


//multipart/form-data [for both files and text fields]
app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));


app.use('/api/v1/payment',paymentRoutes)
app.use('/api/v1/course',courseRoutes)
app.use('/api/v1/profile',profileRoutes)
app.use('/api/v1/user',userRoutes)

//BASE ROUTE
app.get("/",(req,res)=>{
    res.send("Welcome to studyNotion")
})



dbConnect();
connectWithCloudinary();
app.listen(process.env.PORT,()=>{

})

