import { Router } from "express";

const router = Router()

const healthCheck = (req, res) => {
    res.status(200).json({ message: "Server is up and running" });
};

router.route('/').get(
    healthCheck
);

export default router