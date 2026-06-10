const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
// Set JSON limit to 50MB to support base64 file uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const DATA_FILE = path.join(__dirname, 'data', 'data.json');

app.get('/api/content', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    return res.status(404).json({ error: 'Data not found' });
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(data);
});

app.post('/api/content', (req, res) => {
  const password = req.headers['authorization'];
  if (password !== 'Bearer admin123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
  res.json({ success: true });
});

app.post('/api/upload', (req, res) => {
  const password = req.headers['authorization'];
  if (password !== 'Bearer admin123') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { filename, base64Data } = req.body;
  if (!filename || !base64Data) {
    return res.status(400).json({ error: 'Missing filename or base64Data' });
  }

  try {
    const parts = base64Data.split(',');
    const base64Clean = parts.length > 1 ? parts[1] : parts[0];
    const buffer = Buffer.from(base64Clean, 'base64');

    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFilename = `${Date.now()}-${baseName}${ext}`;

    const filePath = path.join(uploadsDir, cleanFilename);
    fs.writeFileSync(filePath, buffer);

    res.json({ url: `/uploads/${cleanFilename}` });
  } catch (err) {
    console.error('Error during file upload:', err);
    res.status(500).json({ error: 'Internal server error during upload' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
