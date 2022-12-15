
const mongoClient = require('mongodb').MongoClient

const state = {
    db:null
}

module.exports.connect = (done)=>{
   // const url1 = 'mongodb+srv://akashanil:<password>@cluster0.6qxu3he.mongodb.net/?retryWrites=true&w=majority'
    const url = 'mongodb://localhost:27017'
    const dbname = 'shopping'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db = data.db(dbname)
        done()
    })

    
}

module.exports.get=()=>{
    return state.db
}