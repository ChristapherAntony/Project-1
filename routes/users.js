var express = require('express');
var router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const productHelpers = require('../helpers/product-helpers');
const categoryHelpers = require('../helpers/category-helpers');
const otpHelpers = require("../helpers/otp-helpers")
const { response } = require('express');
let cartCount=0
let userName=null

//session verifying

const verifyUser = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    //next();
    cartCount=0
    userName=null
    res.render('users/login-signUp');
  }
}





/* GET home page. */
router.get('/',async function (req, res, next) {
  let userData = req.session.user
  if(userData){
    cartCount=await userHelpers.getCartCount(req.session.user._id)
    userName=req.session.user.UserName
    console.log(userName);
  }
 
  
  
  categoryHelpers.getAllCategory().then((category) => {
    //productHelpers.getAllProducts().then(())
    res.render('users/user-home', { category, userName,cartCount })
  })
});

router.get('/viewAll', function (req, res, next) {
  // let userData = req.session.user
  productHelpers.getAllProducts().then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render('users/user-viewAll', { products, category, userName,cartCount })
    })
  })
});
router.get('/viewAll/:id', function (req, res, next) {
  let categoryId = req.params.id
  // let userData = req.session.user
  productHelpers.getCategoryProducts(categoryId).then((products) => {
    categoryHelpers.getAllCategory().then((category) => {
      res.render('users/user-viewAll', { products, category, userName ,cartCount})
    })
  })
});

router.get('/details/:id', (req, res, next) => {
  // let userData = req.session.user
  let productId = req.params.id   //to get the clicked item id
  //let productCategory = await productHelpers.getProductCategory(product.category)
  productHelpers.getProductDetails(productId).then((product) => {
    let category = product.category
    productHelpers.getProductCategory(category).then((categoryName) => {
      productHelpers.getCategoryProducts(category).then((categoryTitle) => {

        res.render('users/product-details', { product, categoryTitle, categoryName, userName ,cartCount});

      })
      // res.render('users/product-details',{product});



    })

  })

});


router.get('/wishlist', verifyUser, (req, res, next) => {
  res.render('users/wishlist',{cartCount,userName});
});

router.get('/login-register', verifyUser, (req, res, next) => {
  res.redirect('/');
});
router.get('/logOut', verifyUser, (req, res, next) => {
  req.session.loggedIn = false
  req.session.user = null
  //req.session.destroy()
  cartCount=0
  userName=null
  res.redirect('/');
});

router.get('/otpLogin', (req, res, next) => {
  res.render('users/otpLogin', { mobileError: req.session.mobileError });
  req.session.mobileError = null;
});

router.get('/otpVerify', (req, res, next) => {

  res.render('users/enterOtp', { otpError: req.session.otpError })
  req.session.otpError = null;

});

router.post('/enterOtp', (req, res, next) => {
  // userHelpers.verifyMobile(req.body.mobile).then((response) => {
  //   if (response.status == false) {
  //     req.session.mobileError = "Please Enter a Registered Mobile Number! ";
  //     res.redirect('/otpLogin');
  //   } else if (response.active == false) {
  //     req.session.mobileError = "Your account is Blocked!";
  //     res.redirect('/otpLogin');
  //   } else {
  //     mobile = `+91${req.body.mobile}`
  //     otpHelpers.sendOTP(mobile).then((data) => {
  //       res.render('users/enterOtp')
  //     })
  //   }
  // })
  ////////////////////////////
  res.render('users/enterOtp') //bypass otp

})

router.post('/verifyOtp', (req, res, next) => {
  let number = (req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six)
  OTP = (+number) // to convert string type to number format
  // otpHelpers.verifyOTP(OTP).then((response) => {
  //   if (response.status) {
  //     res.redirect('/');
  //   }
  //   else {
  //     req.session.otpError = "Invalid OTP";
  //     res.redirect('/otpVerify');
  //   }
  // })
  res.redirect('/'); //for with out otp

});

router.get('/signUp', (req, res, next) => {
  res.render('users/signUp')
});

router.post('/signUp', (req, res) => {
  console.log(req.body);
  userHelpers.doSignUP(req.body).then((response) => {
    if (response.status == false) {
      res.render('users/signUp', { 'emailError': "Email / Mobile Number Already Exists" })
    } else {
      res.redirect('/login-register')   // need to login with password agin to 
    }
  })
})

router.post('/logIn', (req, res) => {

  userHelpers.doLogin  (req.body).then((response) => {
    if (response.status == false) {
      res.render('users/login-signUp', { 'emailError': "Invalid Credentials! " })
    } else if (response.active == false) {
      res.render('users/login-signUp', { 'emailError': "Your Account is Blocked!" })
    }
    else {
      req.session.loggedIn = true
      req.session.user = response.user
     
      res.redirect('/')
    }
  })
})

router.get('/account', verifyUser, (req, res, next) => {
  res.render('users/account',{userName,cartCount} );
});

router.get('/cart', verifyUser, (req, res, next) => {
  userHelpers.getCartProducts(req.session.user._id).then((products) => {
    userHelpers.getCartCount(req.session.user._id).then((response)=>{
      cartCount=response
      res.render('users/cart',{products,userName,cartCount});
    })
  })
});

router.get('/add-to-cart/:id', async(req, res, next) => {
  userHelpers.addToCart (req.params.id, req.session.user._id).then(() => {
    userHelpers.getCartCount(req.session.user._id).then((response)=>{
      cartCount=response
      res.json({status:true})
    })  
  })
})

router.post('/change-product-quantity',(req, res, next) => {
  console.log("from saart of rout");
  userHelpers.changeProductQuantity(req.body).then((response)=>{
    console.log("from end of rout");
    console.log(response);
    res.json(response)
  })
})

router.get('/ProceedToCheckOut',verifyUser, async(req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)

  res.render('users/placeOrder',{cartCount})
})

router.get('/Check-Out',verifyUser,(req,res)=>{

  res.render('/')
})


module.exports = router;
