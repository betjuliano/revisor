import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import { ensureReady, databaseReady } from './services/bootstrapService.js';
import { isHttpError } from './utils/errors.js';

dotenv.config();

const { PORT: envPort } = process.env;
const PORT = Number(envPort ?? 4000);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await ensureReady();
    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Healthcheck falhou:', err);
    res.status(500).json({ status: 'error' });
  }
});

app.use(userRoutes);

app.use((err, _req, res, _next) => {
  console.error('Erro inesperado:', err);
  if (isHttpError(err)) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }
  res.status(500).json({ message: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});

// Ensure that the database migrations start running as soon as the server boots
// even if no route has been hit yet.
databaseReady.catch((err) => {
  console.error('Falha ao inicializar o banco de dados:', err);
});
