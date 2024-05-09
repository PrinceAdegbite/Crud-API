const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate-v2');


const blogSchema = new mongoose.Schema({
    title: { type: String, required: true,  unique: true },
    description: { type: String, required: true },
    tags: { type: [String], required: true },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: { type: Date, default: Date.now },
    state: { type: String, enum: ['draft', 'published'], default: 'draft' },
    readCount: { type: Number, default: 0 },
    readingTime: { type: Number, required: true },
    body: { type: String, required: true }
});


// Apply the pagination plugin to your schema
blogSchema.plugin(mongoosePaginate);

const Blog = mongoose.model('Blog', blogSchema);
module.exports = Blog;