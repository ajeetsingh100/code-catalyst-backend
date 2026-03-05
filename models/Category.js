const mongoose=require("mongoose")

const categorySchema=new mongoose.Schema({
    categoryName:{
        type:String,
        trim:true,
        require:true,
    },
    description:{
        type:String
    },
    courses:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course"
    }]
})

module.exports=mongoose.model("Category",categorySchema)