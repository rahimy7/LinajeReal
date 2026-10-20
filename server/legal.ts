import { Router } from "express";
import path from "node:path";

export const legalRouter = Router();
const directory = path.resolve(import.meta.dirname, process.env.NODE_ENV === "production" ? "public" : "../client/public");
const pages: Record<string, string> = {
  "/privacidad": "privacidad.html",
  "/condiciones-del-servicio": "condiciones-del-servicio.html",
  "/eliminacion-de-datos": "eliminacion-de-datos.html",
};

// Full HTML, available without JavaScript or authentication to Meta and users.
for (const [route, file] of Object.entries(pages)) {
  legalRouter.get(route, (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.sendFile(path.join(directory, file));
  });
}
