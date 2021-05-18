const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const AppError = require('./utilities/AppError');
const wrapAsync = require('./utilities/wrapAsync');
const joi = require('joi');
const engine = require('ejs-mate');
const morgan = require('morgan');
const methodOverride = require('method-override');
const Product = require('./models/product');

// mongoose connection 
mongoose.connect('mongodb://localhost:27017/farmStand', {useNewUrlParser: true, useUnifiedTopology: true})
.then (() => {
    console.log(' Mongo conected!!!')
})
.catch(error => {
 console.log(' Mongo CONECTION Error!!')
 console.log(error)
});

// settings
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.engine('ejs', engine);

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));

app.use((req, res, next) => {
    req.requestTime = Date.now();
    console.log(req.method, req.path);
    next();
})

// /validation server side middleware
const validateProduct = (req, res, next) => {
    const productSchema = joi.object({
            name: joi.string().required(),
            price: joi.number().required().min(0),
            category:joi.string().required()
    })
   const { error } = productSchema.validate(req.body);
   if (error) {
       const msg = error.details.map(el => el.message).join(',')
       throw new AppError(msg, 400)
   } else {
       next();
   }
}


// loop for selected item category
const categories = ['fruit', 'vegetable', 'dairy', 'others'];
// roots
app.get('/products', wrapAsync(async(req, res) => {
        const { category } = req.query;
        if(category){
            const products = await Product.find({category})
            res.render('products/index', { products , categories, category })
        } else {
            const products = await Product.find({})
            res.render('products/index', { products , categories, category: 'All' })
        }  
}))

// home page rout

app.get('/', (req, res) => {
    res.render('products/home');
})

// create new product
app.post('/products', validateProduct, wrapAsync(async(req,res, next) => {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.redirect(`/products/${newProduct._id}`)
}))

//  find product by id
app.get('/products/:id', wrapAsync(async(req, res, next) => {
        const {id} = req.params;
        const product = await Product.findById(id)
        if(!product){
            throw new AppError('Product Not Found', 404);
        } 
         res.render('products/show', { product})
}))

// update product
app.get('/products/:id/edit', wrapAsync(async(req, res, next) => {
        const {id} = req.params;
        const product = await Product.findById(id);
        if(!product){
          throw new AppError('Product Not Found', 404);
        }
        res.render('products/edit', { product, categories })
}))

app.put('/products/:id', validateProduct, wrapAsync(async(req, res, next) => {
        const {id} = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true});
        res.redirect(`/products/${product._id}`)
}))

app.delete('/products/:id', wrapAsync(async(req, res, next) => {
        const {id} = req.params;
        const deletedProduct = await Product.findByIdAndDelete(id, req.body);
        res.redirect('/products/');
    }))


app.all('*', (req, res, next) => {
    next(new AppError('Page Not Found', 404))
})

// error handler
app.use((err, req, res, next) => {
    const { status = 500} = err;
    if(!err.message) err.message = 'Something went wrong';
    res.status(status).render('errors.ejs', { err });
})


app.listen(4000, () => {
console.log('App is on port 4000!')
});
