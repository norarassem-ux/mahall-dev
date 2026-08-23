import { Router } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { signToken, requireAuth } from "../auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "email, password and name are required" });
    }
    if (await db.getUserByEmail(email)) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }
    const user = await db.insertUser({
      id: nanoid(10),
      email,
      name,
      role: role === "owner" ? "owner" : "client",
      passwordHash: bcrypt.hashSync(password, 10),
      createdAt: new Date().toISOString(),
    });
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await db.getUserByEmail(email || "");
    if (!user || !bcrypt.compareSync(password || "", user.passwordHash)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = signToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) { next(err); }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await db.getUserById(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) { next(err); }
});
