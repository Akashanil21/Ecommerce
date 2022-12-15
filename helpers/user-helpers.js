const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const fast2sms = require('fast-two-sms')
const { response } = require('../app')
const objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const { resolve } = require('path')

var instance = new Razorpay({
    key_id: 'rzp_test_pprTT4u1RM2DhH',
    key_secret: 'WvwrboO2jBEt7BidQtgg8Rn2'
})

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response={}
            let user = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ Email: userData.Email})
                if(user){
                    console.log("user already exist")
                    response.User=true
                    resolve(response)
                }else{
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(
                userData = {
                    Name: userData.Name,
                    Email: userData.Email,
                    Password: userData.Password,
                    Number: userData.Number,
                    Access: true
                }
            ).then((data) => {
                userData._id = data.insertedId
                resolve(userData)
            })
          }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION)
                .findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    console.log(status)
                    if (status) {
                        console.log('login successful');
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        console.log('login failed')
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('failed')
                resolve({ status: false })

            }
        })
    },

    getUser: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().sort({_id:-1}).toArray()
            resolve(users)
        })
    },

    obj: {
        OTP: 1
    },

    sendMessage: (Number) => {
        let randomOTP = Math.floor(Math.random() * 10000)
        const options = {
            authorization: "5DtgLcYUqJ8xM3CjQuTXeB9wniHadK7Fm0l1hprWysNI4oE2SAl5qy1LGpcXIQ7NPjsJhaOnD3fgRtTx",
            message: `Your OTP for Shoefer login is ${randomOTP}`,
            numbers: [Number]
        }
        fast2sms.sendMessage(options)
            .then((response) => {
                console.log("OTP send successfully")
            })
            .catch((err) => {
                console.log("error")
            })
        return randomOTP
    },

    addToCart: (productId, userId) => {
        let prodObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let prodExist = userCart.products.findIndex(product => product.item == productId)

                if (prodExist != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: prodObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
            resolve(cartItems)
        })
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    getWishCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let wishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (wishlist) {
                count = wishlist.products.length
            }
            resolve(count)
        })
    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)

        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }

        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.Price' }] } }
                    }
                }

            ]).toArray()
            resolve(total[0].total)
        })
    },

    getCoupons:()=>{
        return new Promise(async(resolve,reject)=>{
           let coupons = await  db.get().collection(collection.COUPON_COLLECTION)
            .find().toArray()
            resolve(coupons)
            })
    },

    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] == 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                status: status,
                field:true,
                date: new Date().toLocaleDateString()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                let i=0
                for(i=0;i<products.length;i++){
                    db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({_id:objectId(products[i].item)},{
                        $inc:{
                            Stock:-products[i].quantity,
                            Sales:products[i].quantity
                        }
                    }).then((response)=>{
                        
                    })
                }
                console.log("order id is: ", response.insertedId)
                resolve(response.insertedId)
            })
        })
    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .find({ userId: objectId(userId) }).sort({_id:-1}).toArray()
            resolve(orders)
        })
    },

    getOrderProducts: (orderId) => {
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
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    console.log("New order is :", order)
                    resolve(order)
                }
            })
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'WvwrboO2jBEt7BidQtgg8Rn2')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },

    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'Placed'
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },

    removeCartProduct: (details) => {
        console.log(details)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(response)
                })
        })
    },

    viewProductDetail: (productId) => {

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: objectId(productId) }).then((product) => {
                    resolve(product)
                })
        })
    },

    cancelOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(orderId)},{
                $set:{
                    status:'cancelled',
                    field:false
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    getUserProfile:(userId)=>{
        console.log(userId)
        return new Promise(async(resolve,reject)=>{

             db.get().collection(collection.USER_COLLECTION)
            .findOne({_id:objectId(userId)}).then((user)=>{
                resolve(user)
        })
        })
    },

    fetchUserDetails:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .findOne({_id:objectId(userId)}).then((user)=>{
                resolve(user)
            })
        })
    },

    updateUser:(userId,userDetails)=>{
        console.log(userId)
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION)
            .updateOne({_id:objectId(userId)},{
                $set:{
                    Name:userDetails.Name,
                    Email:userDetails.Email,
                    Number:userDetails.Number,
                    Address:userDetails.Address
                }
            }).then((response)=>{
                console.log(response)
                resolve()
            })
        })
    },

    addToWishlist: (productId, userId) => {
        let prodObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userWishlist) {
                let prodExist = userWishlist.products.findIndex(product => product.item == productId)

                 if (prodExist != -1) {
                    
                 } else {
                    db.get().collection(collection.WISHLIST_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: prodObj }
                            }
                        ).then((response) => {
                            resolve()
                        })
                 }
            } else {
                let wishlistObj = {
                    user: objectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishlistObj).then((response) => {
                    console.log("hai",response)
                    resolve()
                })
            }
        })
    },

    getWishlistProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item'
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
                        item: 1,product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(wishlistItems)
        })
    },

    removeWishlist: (details) => {
        console.log(details)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: objectId(details.wishlist) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }
                ).then((response) => {
                    resolve(response)
                })
        })
    },

    getCoupon:(couponDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION).findOne({Coupon:couponDetails.Coupon})
            .then((getCoupon)=>{
                resolve(getCoupon)
        })
        })
    },
    
}
