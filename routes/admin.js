const express = require('express');
const { response } = require('../app');
const router = express.Router();
const productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers')

const verifyAdminLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  } else {
    res.redirect('/admin')
  }
}

/* GET Admin page */
router.get('/',(req,res)=>{
    res.render('admin/admin-login',{layout:false})
})

router.get('/admin-home',async function(req, res, next) {
  let totalAmount = await productHelper.getTotalAmount()
  let totalSales = await productHelper.getTotalSales()
  let totalOrders = await productHelper.getTotalOrders()
  let orderDate = await productHelper.getOrderCount()
  let date = await productHelper.getOrderDate()
  let sales = await productHelper.getSalesCount()
  let cod = await productHelper.getCodCount()
  let online = await productHelper.getOnlineCount()
  res.render('admin/admin-home',{layout:false,totalAmount,totalSales,totalOrders,orderDate,date,sales,cod,online})
});

router.get('/product-details',verifyAdminLogin,(req,res)=>{
  productHelper.getProduct().then((products)=>{
    res.render('admin/product-details',{layout:"layoutB",products})
})
})

router.post('/',(req,res)=>{
  if(req.body.username=='akash' && req.body.password=='Akash@123'){
    req.session.admin=true
    req.session.adminLoggedIn=true
    res.redirect('admin/admin-home')
  }else{
    res.redirect('/admin')
  }
})

router.get('/add-product',(req,res)=>{
  productHelper.getCategory().then((categories)=>{
    res.render('admin/add-product',{categories})
  })
})

router.post('/add-product',(req,res)=>{
  productHelper.addProduct(req.body,(insertedId)=>{
    let image = req.files.Image
    const imageName = insertedId

    image.mv('./public/product-images/'+imageName+'.jpg',(err,done)=>{
      if(!err)
      res.render('admin/add-product')
      else
      console.log(err)
    })

  });
})

router.get('/delete-product/:id',(req,res)=>{
  let productId=req.params.id
  productHelper.deleteProduct(productId).then((response)=>{
    res.redirect('/admin/product-details')
  })
})

router.get('/edit-product/:id', async(req,res)=>{
  let product=await productHelper.getProductDetails(req.params.id)
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  let id=req.params.id
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+id+'.jpg')
    }
  })
    
})

router.get('/user-details',verifyAdminLogin,(req,res)=>{
  userHelper.getUser().then((users)=>{
    res.render('admin/user-details',{layout:"layoutB",users})
  })
})

router.get('/admin_logout',verifyAdminLogin,(req,res)=>{
  req.session.adminLoggedIn=false
  res.redirect('/admin')
 
})

router.get('/block-user/:id',(req,res)=>{
  let userId=req.params.id
  productHelper.blockUser(userId).then((response)=>{
    res.redirect('/admin/user-details')
  })
})

router.get('/unblock-user/:id',(req,res)=>{
  let userId=req.params.id
  productHelper.unBlockUser(userId).then((response)=>{
    res.redirect('/admin/user-details')
  })
})

router.get('/categories',verifyAdminLogin,(req,res)=>{
  productHelper.getCategory().then((categories)=>{
    res.render('admin/categories',{categories})
  })
})

router.get('/add-category',(req,res)=>{
  res.render('admin/add-category',{"categoryErr":req.session.categoryExist})
  req.session.categoryExist=false
})

router.post('/add-category',(req,res)=>{
    let categoryData=req.body
    productHelper.addCategory(categoryData).then((response)=>{
      if(response.status){
        req.session.categoryExist="Category already exist"
        res.redirect('/admin/add-category')
        
      }else{
        res.redirect('/admin/categories')
      }
  })
})

router.get('/delete-category/:id',(req,res)=>{
  let catId = req.params.id
  productHelper.deleteCategory(catId).then((response)=>{
    res.redirect('/admin/categories')
  })
})

router.get('/edit-category/:id',async(req,res)=>{
 
  let category = await productHelper.getCategoryDetails(req.params.id)

  res.render('admin/edit-category',{category})
})

router.post('/edit-category/:id',(req,res)=>{
  let catId = req.params.id
  let catDetails = req.body
  productHelper.updateCategory(catId,catDetails).then((response)=>{
    res.redirect('/admin/categories')
  })
})

router.get('/admin-orders',verifyAdminLogin,(req,res)=>{

  productHelper.getAdminOrders().then((orders)=>{
    res.render('admin/admin-orders',{layout:"layoutB",orders})
  })
  
})

router.get('/view-admin-orders/:id', async(req,res)=>{
  let products = await productHelper.viewAdminOrders(req.params.id)
  res.render('admin/view-admin-orders',{layout:"layoutB",products})
})

router.get('/change-order-status',(req,res)=>{

  productHelper.getAdminOrders().then((orders)=>{
    res.render('admin/change-order-status',{layout:"layoutB",orders})
  })
})

router.get('/cancel-admin-order/:id',(req,res)=>{
  let orderId = req.params.id
  productHelper.cancelAdminOrder(orderId).then((response)=>{
    res.redirect('/admin/change-order-status')
  })
})

router.get('/place-admin-order/:id',(req,res)=>{
  let orderId = req.params.id
  productHelper.placeAdminOrder(orderId).then((response)=>{
    res.redirect('/admin/change-order-status')
  })
})

router.get('/ship-order/:id',(req,res)=>{
  let orderId = req.params.id
  productHelper.shipOrder(orderId).then((response)=>{
    res.redirect('/admin/change-order-status')
  })
})

router.get('/deliver-order/:id',(req,res)=>{
  let orderId = req.params.id
  productHelper.deliverOrder(orderId).then((response)=>{
    res.redirect('/admin/change-order-status')
  })
})

router.get('/admin-dashboard',verifyAdminLogin,(req,res)=>{
  res.render('admin/admin-dashboard',{layout:false})
})

router.get('/add-coupon',verifyAdminLogin,(req,res)=>{

  res.render('admin/add-coupon',{layout:"layoutB"})
})

router.post('/add-coupon',(req,res)=>{

  let details = req.body
  productHelper.addCoupon(details).then((couponData)=>{
    res.redirect('/admin/add-coupon')
  })
})

router.get('/coupon-details',verifyAdminLogin,(req,res)=>{

  productHelper.getCoupons().then((coupons)=>{
    res.render('admin/coupon-details',{layout:"layoutB",coupons})
  })
  
})

router.get('/delete-coupon/:id',(req,res)=>{

  let coupId = req.params.id
  productHelper.deleteCoupon(coupId).then((response)=>{
    res.redirect('/admin/coupon-details')
  })
})

router.get('/edit-coupon/:id',async(req,res)=>{
  let coupon = await productHelper.getCouponDetails(req.params.id)
  res.render('admin/edit-coupon',{layout:"layoutB",coupon})
})

router.post('/edit-coupon/:id',(req,res)=>{
  let coupId = req.params.id
  let coupDetails = req.body
  productHelper.editCouponDetails(coupId,coupDetails).then((response)=>{
    res.redirect('/admin/coupon-details')
  })
})

router.get('/sales-report',(req,res)=>{
  productHelper.getSalesDetails().then((products)=>{
    res.render('admin/sales-report',{layout:"layoutB",products})
  })
  
})

module.exports = router;
