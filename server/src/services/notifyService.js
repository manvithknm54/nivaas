import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendMail } from "./mailService.js";

export const notify = async ({ user, kind, key, title, body = "", link = "", email = false }) => {
  try {
    const data = { kind, title, body, link, read: false, at: new Date() };
    if (key) await Notification.findOneAndUpdate({ user, key }, { $set: data }, { upsert: true });
    else await Notification.create({ user, ...data });
    if (email) {
      const u = await User.findById(user).select("email");
      if (u) await sendMail({ to: u.email, subject: title, text: `${body}\n\nOpen Nivaas: ${process.env.CLIENT_URL}${link}` });
    }
  } catch (err) {
    console.error("[notify]", err.message);
  }
};