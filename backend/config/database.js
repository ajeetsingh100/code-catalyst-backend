const mongoose=require('mongoose')
require('dotenv').config()

const dbConnect=()=>{
    mongoose.connect(process.env.DB_URL,{
        useNewUrlParser:true,
        useUnifiedTopology:true
    })
    .then(()=>{
        console.log("db is connected")
    }).catch(()=>{console.log("unable to connect with")})
}
module.exports=dbConnect