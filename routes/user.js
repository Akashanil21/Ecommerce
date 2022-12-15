const express = require('express');
const { response } = require('../app');
const router = express.Router();
const productHelper = require('../helpers/product-helpers');
const { sendMessage } = require('../helpers/user-helpers');
const userHelper = require('../helpers/user-helpers')
const fast2sms = require('fast-two-sms');
const { localsAsTemplateData } = require('hbs');
const { check, validationResult } = require('express-validator');
const { ResultWithContext } = require('express-validator/src/chain');
const { Db } = require('mongodb');

const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  productHelper.getProduct().then((products) => {
    res.render('user/home', { layout: 'layoutA', user, products, cartCount,wishCount });
  })

});

router.get('/men', async (req, res, next) => {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  productHelper.getMenProduct().then((products) => {

    res.render('user/men', { layout: "layoutA", products, user, cartCount,wishCount })
  })

})

router.get('/women', async (req, res, next) => {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  productHelper.getWomenProduct().then((products) => {

    res.render('user/women', { layout: "layoutA", products, user, cartCount,wishCount })
  })
})


router.get('/login', (req, res, next) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { layout: false, "loginErr": req.session.userLoginErr, "accessErr": req.session.accessErr })
    req.session.userLoginErr = false
    req.session.accessErr = false
  }
})

router.get('/signup', (req, res, next) => {
  res.render('user/signup', { layout: false,"userExist":req.session.userAlreadyExist})
  req.session.userAlreadyExist = false
})

router.post('/signup',
  check('Name').notEmpty()
    .withMessage("please Enter a Name"),
  check('Email').matches(/^\w+([\._]?\w+)?@\w+(\.\w{2,3})(\.\w{2})?$/)
    .withMessage("Must be a valid Email id"),
  check('Password').matches(/[\w\d!@#$%^&*?]{6,}/)
    .withMessage("Password must contain atleast 6 characters"),
  (req, res) => {
    const errors = validationResult(req)
    let error1 = errors.errors.find(item => item.param === 'Name') || '';
    let error2 = errors.errors.find(item => item.param === 'Email') || '';
    let error3 = errors.errors.find(item => item.param === 'Password') || '';

    if (!errors.isEmpty()) {
      res.render('user/signup', { layout: false, nameMsg: error1.msg, emailMsg: error2.msg, passwordMsg: error3.msg })
    }else{ 
      userHelper.doSignup(req.body).then((response) => {
         if(response.User){
          req.session.userAlreadyExist ="User already exist"
          res.redirect('/signup')
        }else{

        console.log(response)
        req.session.user = response
        req.session.userLoggedIn = true
        userHelper.obj.OTP = userHelper.sendMessage(req.body.Number)
        res.redirect('/otp')
        }
      })
    }
  })



router.post('/login', (req, res, next) => {
  userHelper.doLogin(req.body).then((response) => {
    if (!response.status) {
      req.session.userLoginErr = "Invalid user name or password"
      res.redirect('/login')
    } else if (!response.user.Access) {
      req.session.accessErr = "You are currently blocked from accessing this website"
      res.redirect('/login')
    }
    else {
      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    }

  })
})

router.get('/logout', (req, res, next) => {
  req.session.user = null
  req.session.userLoggedIn = false
  req.session.isVerified = false
  res.redirect('/')
})

router.get('/about', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  res.render('user/about', { layout: 'layoutA', user, cartCount,wishCount })
})

router.get('/contact', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  let wishCount = null
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  res.render('user/contact', { layout: 'layoutA', user, cartCount,wishCount })
})

router.get('/otp', (req, res) => {
  if (req.session.isVerified) {
    res.redirect('/')
  } else {
    req.session.isVerified = true
    res.render('user/otp', { layout: false })
  }
})

router.post('/otp', (req, res) => {
  if (req.body.otp == userHelper.obj.OTP) {
    res.redirect('/')

  }

})

router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let total = 0
  if (products.length > 0) {
    total = await userHelper.getTotalAmount(req.session.user._id)
  }
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  wishCount = await userHelper.getWishCount(req.session.user._id)
  res.render('user/cart', { layout: "layoutA", products, user: req.session.user._id,total, cartCount,wishCount})
})

router.get('/add-to-cart/:id', (req, res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/change-product-quantity', (req, res, next) => {
  userHelper.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.get('/checkout', verifyLogin, async (req, res) => {
  let total = await userHelper.getTotalAmount(req.session.user._id)
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  let wishCount = await userHelper.getWishCount(req.session.user._id)
  let coupons = await userHelper.getCoupons()
  res.render('user/checkout', { layout: 'layoutA', user: req.session.user, total, cartCount,wishCount,coupons })
})

router.post('/checkout', async (req, res) => {
  let products = await userHelper.getCartProductList(req.body.userId)
  let totalPrice = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment-method'] == 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelper.generateRazorpay(orderId, totalPrice).then((response) => {
        res.json(response)
      })
    }

  })
})

router.get('/order-success', (req, res) => {
  
  res.render('user/order-success', { layout: 'layoutA', user: req.session.user })
})

router.get('/orders', verifyLogin,async (req, res) => {
  let cartCount = await userHelper.getCartCount(req.session.user._id)
  let orders = await userHelper.getUserOrders(req.session.user._id)
  wishCount = await userHelper.getWishCount(req.session.user._id)
  res.render('user/orders', { layout: 'layoutA', user: req.session.user, orders,cartCount,wishCount })
})

router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products', { layout:"layoutA", user: req.session.user, products })
})

router.post('/verify-payment', (req, res) => {
  console.log(req.body)
  userHelper.verifyPayment(req.body).then(() => {
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(() => {
      console.log("payment successful")
      res.json({ status: true })
    })
  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
})

router.post('/remove-cart-product', (req, res) => {
  userHelper.removeCartProduct(req.body).then((response) => {
    res.json(response)
  })
})


router.get('/product-view',async(req, res) => {

  let productId = req.query.id
  let user = req.session.user
  console.log("product id is",productId)
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  userHelper.viewProductDetail(productId).then((product) => {
    res.render('user/product-overview',{layout:'layoutA',user,product,cartCount,wishCount})
  })


})

router.get('/cancel-order/:id',(req,res)=>{

  let orderId=req.params.id

  userHelper.cancelOrder(orderId).then((response)=>{
    res.redirect('/orders')
  })
})

router.get('/user-profile',verifyLogin,async(req,res)=>{
  let userId = req.session.user._id
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  userHelper.getUserProfile(userId).then((user)=>{
    res.render('user/user-profile',{layout:"layoutA",user,cartCount,wishCount})
  })
  
})

router.get('/edit-user-profile/:id',async(req,res)=>{

 let user = await userHelper.fetchUserDetails(req.params.id)
 res.render('user/edit-profile',{layout:false,user})
})

router.post('/edit-user-profile/:id',(req,res)=>{
  let userId = req.params.id
  let userDetails = req.body
  userHelper.updateUser(userId,userDetails).then((response)=>{
    res.redirect('/user-profile')
  })
})

router.get('/wishlist',verifyLogin,async(req,res)=>{
  if (req.session.user) {
    cartCount = await userHelper.getCartCount(req.session.user._id)
    wishCount = await userHelper.getWishCount(req.session.user._id)
  }
  let products = await userHelper.getWishlistProducts(req.session.user._id)
  res.render('user/wishlist',{layout:"layoutA",products,user:req.session.user._id,cartCount,wishCount})
})

router.get('/add-to-wishlist/:id', (req, res) => {
  userHelper.addToWishlist(req.params.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})

router.post('/remove-wishlist-product',(req,res)=>{

  userHelper.removeWishlist(req.body).then((response)=>{
    res.json(response)
  })
})

router.post('/coupon-check',async(req,res)=>{
  console.log("coupon checkinggg");
  
  let totalPrice = await userHelper.getTotalAmount(req.session.user._id)
    userHelper.getCoupon(req.body)
        .then((findcoupon)=>{
          console.log("checking then findcoupon",findcoupon);


          if (findcoupon == null) {
            res.json({ code: true, errMsg: "Invalid Coupon" });
            console.log("no coupon");
          } else if (findcoupon.user) {
            console.log("inside loop");
            let n = 0;
            for (couponUser of findcoupon.user) {
              if (couponUser == userId) {
                n++;
              }
            }
            if (n > 0) {
              res.json({ status: true, errMsg: "Coupon already used" });
            } else {
              coupon = findcoupon.Coupon;
              let value = parseInt(findcoupon.Amount);
              let discount = parseInt(findcoupon.Discount);
      
              if (totalPrice > value) {
                discountAdded = totalPrice - discount;
                res.json({ discountAdded, discount, errMsg: "Coupon Applied" });
              } else {
                res.json({ value, errMsg: "Amount is Not Enough" });
              }
            }
          }else {
            coupon = findcoupon.Coupon;
            let value = parseInt(findcoupon.Amount);
            let discount = parseInt(findcoupon.Discount);
    
            if (totalPrice > value) {
              discountAdded = totalPrice - discount;
              res.json({ discountAdded, discount, errMsg: "Coupon Applied" });
            } else {
              res.json({ value, errMsg: "Amount is Not Enough" });
            }
          }
        })
})

module.exports = router;
