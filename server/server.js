const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Ensure the uploads directory exists
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

app.post('/upload', upload.single('savefile'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const filePath = req.file.path;
  const pythonProcess = spawn('python3', ['relic_extractor.py', filePath]);

  let relicData = '';
  let errorData = '';

  pythonProcess.stdout.on('data', (data) => {
    relicData += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  pythonProcess.on('close', (code) => {
    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });

    if (code !== 0) {
      console.error(`Python script exited with code ${code}`);
      console.error(errorData);
      return res.status(500).json({ error: 'Failed to process save file.', details: errorData });
    }

    try {
      const jsonData = JSON.parse(relicData);
      res.json(jsonData);
    } catch (e) {
      console.error('Error parsing JSON from python script:', e);
      console.error('Python script output:', relicData);
      res.status(500).json({ error: 'Failed to parse relic data.', details: relicData });
    }
  });
});

// Serve the React app for production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});