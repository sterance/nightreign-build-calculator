const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// ensure the uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(cors());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('savefile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;

  try {
    const { extractAllRelicsFromSl2 } = await import('../client/src/utils/relicExtractor.js');
    const fileBuffer = await fs.promises.readFile(filePath);
    const relicData = await extractAllRelicsFromSl2(fileBuffer.buffer);
    
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });
    
    res.json(relicData);
  } catch (error) {
    console.error('Error processing save file:', error);
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });
    res.status(500).json({ error: 'Failed to process save file.', details: error.message });
  }
});

if (process.env.NODE_ENV !== 'production') {
  // serve the React app for development
  const clientBuildPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});