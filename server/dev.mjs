import express from 'express';
import { createServer as createViteServer } from 'vite';
import { analyzeBrand } from './analyzeBrand.mjs';

const port = Number(process.env.PORT || 5173);
const app = express();

app.use(express.json({ limit: '1mb' }));

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  next(error);
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body || {};

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Provide a website URL to analyze.' });
      return;
    }

    const result = await analyzeBrand(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to analyze that website.'
    });
  }
});

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'spa'
});

app.use(vite.middlewares);

app.listen(port, () => {
  console.log(`Styleguide Builder running at http://localhost:${port}`);
});
