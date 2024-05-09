const express = require('express')
const router = express.Router()
const Blog = require('../models/Blog')
const auth = require('../middlewares/auth')
const { calculateReadingTime } = require('../utils');





//create blog post
router.post('/createblog', auth, async (req, res) => {

    const { title, description, tags, body } = req.body;
    const author = req.user._id;
    const readingTime = calculateReadingTime(body);
    const timestamp = new Date(); // Current date and time
    const state = 'draft'; // Default state
    const readCount = 0; // Default read count

    try {
        const blog = new Blog({
            title,
            description,
            tags,
            author,
            timestamp,
            state,
            readCount,
            readingTime,
            body
        });
        await blog.save();
        res.json({
            message: 'Blog created successfully'
        });
    } catch (err) {
        res.status(400).send(err.message);
    }
});



// Get list of owner's blogs
router.get('/my-blogs', auth, async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const state = req.query.state; // Optional state filter
    try {
        let query = { author: req.user._id };
        if (state) {
            query.state = state;
        }
        const blogs = await Blog.paginate(query, { page, limit });
        res.send(blogs);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Update blog state to 'published' by the owner
router.put('/:id/publish', auth, async (req, res) => {
    const id = req.params.id;
    try {
        const blog = await Blog.findOneAndUpdate(
            { _id: id, author: req.user._id },
            { state: 'published' },
            { new: true }
        );
        if (!blog) return res.status(404).send('Blog not found or you are not the owner.');
        res.json({
            message: 'Blog published successfully'
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// List of blogs endpoint accessible by both logged in and not logged in users
router.get('/', async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const searchQuery = req.query.search;
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder || 'asc'; // Default sorting order

    // Construct query object for filtering
    let query = { state: 'published' };
    if (searchQuery) {
        query.$or = [
            { author: { $regex: searchQuery, $options: 'i' } },
            { title: { $regex: searchQuery, $options: 'i' } },
            { tags: { $regex: searchQuery, $options: 'i' } }
        ];
    }

    // Sort order and field
    let sortOptions = {};
    if (sortBy) {
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    try {
        const blogs = await Blog.paginate(query, { page, limit, sort: sortOptions });
        res.json({
            message: 'Blogs fetched successfully',
            
            blogs
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Get single published blog by ID
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const blog = await Blog.findOne({ _id: id, state: 'published' });
        if (!blog) return res.status(404).send('Blog not found');
        res.send(blog);
    } catch (err) {
        res.status(500).send(err.message);
    }
});




router.patch('/updateblog/:id', auth, async (req, res) => {
    const { title, description, tags, body } = req.body;
    try {
        const updatedBlog = await Blog.findOneAndUpdate(
            { _id: req.params.id, author: req.user._id },
            { title, description, tags, body },
            { new: true }
        );

        if (!updatedBlog) {
            return res.status(404).json({ message: 'Blog not found or you are not the owner.' });
        }

        res.json({
            message: 'Blog updated successfully',
            updatedBlog
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Delete blog by the owner
router.delete('/:id', auth, async (req, res) => {
    const id = req.params.id;
    try {
        const blog = await Blog.findOneAndDelete({ _id: id, author: req.user._id });
        if (!blog) return res.status(404).send('Blog not found or you are not the owner.');
        res.json({
            message: 'Blog deleted successfully'
        });
    } catch (err) {
        res.status(500).send(err.message);
    }
});



module.exports = router;