const cloudinary=require("cloudinary").v2
require("dotenv").config()
function connectWithCloudinary(){
   try{
     cloudinary.config({
        cloud_name:process.env.cloud_name,
        api_key:process.env.api_key,
        api_secret:process.env.secret_key
    })
    console.log("app is connected with cloudinary")
   }catch(error){
    console.error(error.message);
    console.log("unable to connect with cloudinary")
   }
}

module.exports=connectWithCloudinary;