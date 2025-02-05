import express from 'express';
import dotenv from 'dotenv';
import chatRouter from './chat.js';
import marketRouter from './market.js';
import documentRouter from './document.js';
import cors from 'cors';
 

dotenv.config();

const app = express();

app.use(cors({
    origin: 'https://bot-six-rho.vercel.app', // Your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  }));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;

app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  limit: '50mb', 
  extended: true 
}));

app.use('/chat', chatRouter);
app.use('/market', marketRouter);
app.use('/document', documentRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});