import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

// parse application/json
app.use(express.json({ limit: '16kb' }));

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// Serve static files
app.use(express.static('public'));

app.use(cookieParser())

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/health-check', (req, res) => {
    res.send('Congratulations, Server is running!');
});

export default app;

