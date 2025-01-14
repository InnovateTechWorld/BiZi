import express from 'express';
import dotenv from 'dotenv';
import chatRouter from './chat.js';
import cors from 'cors';


dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://bi-zi-mate.vercel.app', // Your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;

app.use(express.json());

app.use('/chat', chatRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});