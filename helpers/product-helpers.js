const db = require('../config/connection')
const collection = require('../config/collections')
const { response } = require('../app')
const objectId = require('mongodb').ObjectId
module.exports ={

    addProduct:(product,callback)=>{

        db.get().collection('product').insertOne(
            product={
                Name:product.Name,
                Category:product.Category,
                Subcategory:product.Subcategory,
                Price:product.Price,
                Stock:product.Stock,
                Description:product.Description,
                Available:true
            }
        ).then((data)=>{

            callback(data.insertedId)
        })
    },

    getProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({Available:true}).sort({_id:-1}).toArray()
            resolve(products)
        })
    },

    getMenProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:"Men",Available:true}).toArray()
            resolve(products)
        })
    },

    getWomenProduct:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({Category:"Women",Available:true}).toArray()
            resolve(products)
        })
    },

    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(productId)},{
                $set:{
                    Available:false

                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(productId,ProDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(productId)},{
               $set:{
                Name:ProDetails.Name,
                Category:ProDetails.Category,
                Price:ProDetails.Price
               } 
            }).then((response)=>{
                resolve()
            })
                
        })
    },

    blockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},{
                $set:{
                   Access:false 
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    unBlockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},{
                $set:{
                    Access:true
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    addCategory:(categoryData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let category = await db.get().collection(collection.CATEGORY_COLLECTION)
            .findOne({Category:categoryData.Category})
            if(category){
                console.log("category already exist")
                response.status=true
                resolve(response)
            }else{
             db.get().collection(collection.CATEGORY_COLLECTION)
            .insertOne(
                categoryData={
                    Category:categoryData.Category,
                    Description:categoryData.Description
                }
            ).then((data)=>{
                categoryData._id=data.insertedId
                resolve(categoryData)
            })
          }
        })
    },

    getCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let categories = await db.get().collection(collection.CATEGORY_COLLECTION)
            .find().sort({_id:-1}).toArray()
            resolve(categories)
        })
    },

    deleteCategory:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .deleteOne({_id:objectId(catId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    getCategoryDetails:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .findOne({_id:objectId(catId)}).then((category)=>{
                resolve(category)
            })
        })
    },

    updateCategory:(catId,catDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION)
            .updateOne({_id:objectId(catId)},{
                $set:{
                    Category:catDetails.Category,
                    Description:catDetails.Description
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getAdminOrders:()=>{
        return new Promise((resolve,reject)=>{

         let orders = db.get().collection(collection.ORDER_COLLECTION)
            .find().sort({_id:-1}).toArray()
            resolve(orders)
        })
      
    },

    viewAdminOrders:(orderId)=>{
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(orderItems)
        })
    },

    cancelAdminOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:"Cancelled",
                    field:false
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },

    placeAdminOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:"Placed",
                    field:true
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },

    shipOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:"Shipped",
                    field:true
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },

    deliverOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:"Delivered",
                    field:true
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    },

    addCoupon:(couponData)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .insertOne(couponData).then((data)=>{
                couponData._id = data.insertedId
                resolve(couponData)
            })
        })
    },

    getCoupons:()=>{
        return new Promise(async(resolve,reject)=>{
            let coupons = await db.get().collection(collection.COUPON_COLLECTION)
            .find().sort({_id:-1}).toArray()
            resolve(coupons)
        })
    },

    deleteCoupon:(coupId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .deleteOne({_id:objectId(coupId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    getCouponDetails:(coupId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .findOne({_id:objectId(coupId)}).then((coupon)=>{
                resolve(coupon)
            })
        })
    },

    editCouponDetails:(coupId,coupDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .updateOne({_id:objectId(coupId)},{
                $set:{
                    Coupon:coupDetails.Coupon,
                    Date:coupDetails.Date,
                    Amount:coupDetails.Amount,
                    Discount:coupDetails.Discount
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getTotalAmount:()=>{
        return new Promise(async(resolve,reject)=>{
            let totalAmount =await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:"Delivered"}
                },
                {
                    $project:{_id:0,status:1,totalAmount:1}
                },
                {
                    $group:{_id:"status",total:{$sum:"$totalAmount"}}
                }
            ]).toArray()
            resolve(totalAmount[0].total)
           
        })
    },

    getTotalSales:()=>{
        return new Promise(async(resolve,reject)=>{
            let totalSales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:"Delivered"}
                },
                {
                    $project:{_id:0,status:1}
                },
                {
                    $group:{_id:"status",total:{$sum:1}}
                }
            ]).toArray()
            resolve(totalSales[0].total)
        })
    },

    getTotalOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let totalOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{_id:"",count:{$sum:1}}
                }
            ]).toArray()
        resolve(totalOrders[0].count)
        })
        
    },

    getOrderCount:()=>{
        return new Promise(async(resolve,reject)=>{
            let orderCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{_id:"$date", count:{$sum:1}}
                },
                {
                    $sort:{_id:-1}
                },
                {
                    $limit:5
                },
                {
                    $project:{_id:0,count:1}
                }

            ]).toArray()
            let count = [];
            let i;
            let n=orderCount.length
            for(i=0;i<n;i++){
             count[n-1-i]=orderCount[i].count
            }
            resolve(count)
        })
    },

    getOrderDate:()=>{
        return new Promise(async(resolve,reject)=>{
            let orderDate = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $group:{_id:"$date", count:{$sum:1}}
                },
                {
                    $sort:{_id:-1}
                },
                {
                    $limit:5
                },
                {
                    $project:{_id:1,count:0}
                }
            ]).toArray()
            console.log(orderDate)
            let count = [];
            let i;
            let n=orderDate.length
            for(i=0;i<n;i++){
             count[n-1-i]=orderDate[i]._id
            }
            let obj={}
            for(i=0;i<count.length;i++){
                obj[i]=count[i]

            }
            console.log(obj)
            resolve(obj)
        })
    },

    getSalesCount:()=>{
        return new Promise(async(resolve,reject)=>{
            let salesCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{status:"Delivered"}
                },
                {
                    $group:{_id:"$date",count:{$sum:1}}
                },
                {
                    $sort:{_id:-1}
                },
                {
                    $limit:5
                },
                {
                    $project:{_id:0,count:1}
                }
            ]).toArray()
            let count = [];
            let i;
            let n=salesCount.length
            for(i=0;i<n;i++){
             count[n-1-i]=salesCount[i].count
            }
            resolve(count)
        })
    },

    getSalesDetails:()=>{
        return new Promise(async(resolve,reject)=>{
          let products =await db.get().collection(collection.PRODUCT_COLLECTION)
            .find().toArray()
            resolve(products)
        })
    },

    getCodCount:()=>{
        return new Promise(async(resolve,reject)=>{
            let totalCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{paymentMethod:"COD"}
                },
                {
                    $group:{_id:'$COD',count:{$sum:1}}
                },
                {

                    $project:{_id:0,count:1}
                }
            ]).toArray()
            resolve(totalCount[0].count)
        })
    },
    getOnlineCount:()=>{
        return new Promise(async(resolve,reject)=>{
            let totalCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{paymentMethod:"ONLINE"}
                },
                {
                    $group:{_id:'$ONLINE',count:{$sum:1}}
                },
                {

                    $project:{_id:0,count:1}
                }
            ]).toArray()
            console.log(totalCount[0].count)
            resolve(totalCount[0].count)
        })
    }
}