const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const User = require('../models/User')
const nodemailer = require('nodemailer')

require('dotenv').config();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {

        user: process.env.COMPANY_EMAIL,
        pass: process.env.COMPANY_PASSWORD
    }
})


router.get('/', (req, res) => {
    res.json({
        message: 'User route is working'
    })
})


router.post('/register', async (req, res) => {
    

    try{
        const { first_name, last_name, email, password } = req.body;
        const user = new User ({first_name, last_name, email, password});
        await user.save();
        res.json({
            message: 'User created successfully'

        })
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})


router.post('/login', async (req, res) => {
    

    try{
        const {  email, password } = req.body;
       const user = await User.findOne({email});
       if(!user) {
         return res.status(400).json({
            message: 'User not found'
         })
       }

       const isMatch = await bcrypt.compare(password, user.password);
       if(!isMatch) {
        return res.status(400).json({
            message: 'Invalid credentials'
        })
       }

     // Token expiration time: 1 hour (3600 seconds)
     const token = jwt.sign({
        userId: user._id
    },  process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

    res.json({ token, user, message: 'User logged in successfully', message2: 'Token generated successfully' });// Send token in response
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
})


router.post('/sendotp', async (req, res) => {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);

    try {
        const mailOptions = {
            from: process.env.COMPANY_EMAIL,
            to: email,
            subject: 'OTP for account verification',
            text: `Your OTP for verification is: ${otp}`
        };

        transporter.sendMail(mailOptions, async (err, info) => {
            if (err) {
                console.error('Error sending OTP email:', err);
                res.status(500).json({ message: 'Failed to send OTP email' });
            } else {
                const user = await User.findOne({email})
                if(!user) {
                    return res.status(400).json({
                        message: 'User not found'
                    })
                }

                user.otp = otp;
                await user.save();

                console.log(otp)
                console.log('OTP email sent successfully:', info);
                res.json({ message: 'OTP sent successfully' });
            }
        });
    } catch (err) {
        console.error('Error sending OTP email:', err);
        res.status(500).json({ message: 'Failed to send OTP email' });
    }
});


router.post('/changepassword', async (req, res) => {
    const {email, otp, newpassword} = req.body

    try{
        const user = await User.findOne({email})

        if(!user) {
            return res.status(400).json({
                message: 'User not found'
            })
        }

        if(user.otp != otp) {
            return res.status(400).json({
                message: 'Invalid OTP'
            })
        }

        user.password = newpassword
        user.otp = null;
        await user.save()

        res.json({
            message: 'Password changed successfully'
        })
    }

    catch{}
})



module.exports = router;