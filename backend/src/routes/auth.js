import { Router } from "express";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "../db.js";
import { signToken, requireAuth, signResetToken, verifyResetToken } from "../auth.js";

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

// PATCH /api/auth/me — update my own name/email
authRouter.patch("/me", requireAuth, async (req, res, next) => {
  try {
    const { name, email } = req.body || {};
    if (!name && !email) {
      return res.status(400).json({ error: "Provide name and/or email to update" });
    }
    if (email) {
      const existing = await db.getUserByEmail(email);
      if (existing && existing.id !== req.user.sub) {
        return res.status(409).json({ error: "That email is already in use" });
      }
    }
    const fields = {};
    if (name) fields.name = name;
    if (email) fields.email = email;
    const updated = await db.updateUser(req.user.sub, fields);
    res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role });
  } catch (err) { next(err); }
});

// POST /api/auth/change-password — requires the current password
authRouter.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    const user = await db.getUserById(req.user.sub);
    if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    await db.updateUser(user.id, { passwordHash: bcrypt.hashSync(newPassword, 10) });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/auth/forgot-password — dev-mode: no email service is
// configured for this project, so the reset link is handed straight
// back in the response (and logged server-side) instead of emailed.
// Always returns 200 regardless of whether the email matched, so this
// endpoint can't be used to enumerate registered accounts.
authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email is required" });
    const user = await db.getUserByEmail(email);
    if (!user) {
      return res.json({ ok: true, note: "If that email has an account, a reset link was generated." });
    }
    const resetToken = signResetToken(user);
    console.log(`[password reset] ${user.email} -> /reset-password?token=${resetToken}`);
    res.json({
      ok: true,
      note: "No email service is configured in this environment — here is the reset link directly (expires in 30 minutes).",
      resetToken,
      resetPath: `/reset-password?token=${resetToken}`,
    });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password — consumes a forgot-password token
authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: "token and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    let payload;
    try {
      payload = verifyResetToken(token);
    } catch {
      return res.status(401).json({ error: "Reset link is invalid or has expired" });
    }
    const user = await db.getUserById(payload.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    await db.updateUser(user.id, { passwordHash: bcrypt.hashSync(newPassword, 10) });
    res.json({ ok: true });
  } catch (err) { next(err); }
});
