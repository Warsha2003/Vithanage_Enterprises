//V2ft5D1dbTssVJzR

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./Routes/authRoutes');
const adminRoutes = require('./Routes/adminRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.send('Vithanage Enterprises API is working');
});

// Auth routes
app.use('/api/auth', authRoutes);
// Admin routes
app.use('/api/admin', adminRoutes);

mongoose.connect("mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/")
.then(()=> console.log("Connected to MongoDB"))
.then(()=>{
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.log('Port 5000 is already in use. The server is probably already running.');
      } else {
        console.error('Server error:', error);
      }
    });
})
.catch((err)=> console.log(err));