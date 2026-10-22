// server/routes.ts - ACTUALIZACIÓN
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { omnichannelRouter } from "./omnichannel";
import { legalRouter } from "./legal";
import { communityRouter } from "./community";

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(legalRouter);
  app.use("/api/community", communityRouter);
  app.use("/api/omnichannel", omnichannelRouter);

  // Tus rutas existentes se mantienen aquí
  // prefix all routes with /api

  // Ejemplo de ruta de prueba (opcional)
  app.get('/api/test', (req, res) => {
    res.json({ 
      message: 'Linaje Real API funcionando',
      timestamp: new Date().toISOString(),
      bible_api: 'Disponible en /api/bible'
    });
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);
  return httpServer;
}
