import { nextId, readDb, updateDb } from "../data/db.js";
import { hashPassword, signToken, verifyPassword } from "../utils/auth.js";
import { sanitizeUser } from "../utils/sanitize.js";

export async function register(req, res) {
  const { name, email, hometown, password } = req.body;

  if (!name || !email || !hometown || !password) {
    return res.status(400).json({ message: "name, email, hometown, and password are required" });
  }

  const db = await readDb();
  const existingUser = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const user = await updateDb(async (draft) => {
    const createdUser = {
      id: nextId("u", draft.users),
      name,
      email,
      hometown,
      passwordHash: hashPassword(password),
      role: "member",
      bio: "New community member"
    };

    draft.users.push(createdUser);
    return createdUser;
  });

  const safeUser = sanitizeUser(user);
  const token = signToken({ userId: user.id, role: user.role });

  return res.status(201).json({ message: "User registered successfully", user: safeUser, token });
}

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const db = await readDb();
  const user = db.users.find((entry) => entry.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const safeUser = sanitizeUser(user);
  const token = signToken({ userId: user.id, role: user.role });

  return res.json({ message: "Login successful", user: safeUser, token });
}

export async function getMe(req, res) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.id === req.user.id);
  return res.json({ user: sanitizeUser(user) });
}

export async function updateMe(req, res) {
  const { name, hometown, bio } = req.body;

  if (!name?.trim() || !hometown?.trim()) {
    return res.status(400).json({ message: "name and hometown are required" });
  }

  const result = await updateDb(async (db) => {
    const user = db.users.find((entry) => entry.id === req.user.id);

    if (!user) {
      return { error: { status: 404, message: "User not found" } };
    }

    user.name = name.trim();
    user.hometown = hometown.trim();
    user.bio = bio?.trim() || "Community member";

    return { user };
  });

  if (result.error) {
    return res.status(result.error.status).json({ message: result.error.message });
  }

  return res.json({ message: "Profile updated", user: sanitizeUser(result.user) });
}
