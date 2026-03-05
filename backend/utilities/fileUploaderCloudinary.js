const cloudinary=require("cloudinary").v2

exports.uploadToCloudinary=async (file,folder,...imgProp)=>{
    const options={}
    const [quality,height,width]=[...imgProp]
    options.resource_type="auto"
    if(quality){
        options.quality=quality
    }
    if(height){
        options.height=height
    }
    if(width){
        options.width=width
    }
    if(folder){
        options.folder=folder
    }
    const uploaded_file=await cloudinary.uploader.upload(file.tempFilePath,options)
    
    return uploaded_file
}


