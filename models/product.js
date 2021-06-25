const mongoose = require('mongoose');
const { Schema } = mongoose;


const productSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true,
        min: 0
    },
    category: {
        type: String,
        lowercase: true,
        enum: ['fruit','vegetable','dairy', 'others', 'beverages']
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

const Product = mongoose.model('Product', productSchema);
module.exports = Product;

