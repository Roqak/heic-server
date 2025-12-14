const express = require('express');
const fileUpload = require('express-fileupload');
const heicConvert = require('heic-convert');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all origins (dev mode)
app.use(cors());

// Enable file upload
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    abortOnLimit: true
}));

app.post('/convert', async (req, res) => {
    if (!req.files || !req.files.image) {
        return res.status(400).send('No files were uploaded.');
    }

    const imageFile = req.files.image;
    const format = req.body.format || 'JPEG'; // JPEG or PNG
    const quality = parseFloat(req.body.quality) || 0.9;

    try {
        console.log(`Processing ${imageFile.name} (${imageFile.size} bytes) -> ${format}`);

        const outputBuffer = await heicConvert({
            buffer: imageFile.data,
            format: format.toUpperCase(), // 'JPEG' or 'PNG'
            quality: quality
        });

        res.set('Content-Type', format === 'PNG' ? 'image/png' : 'image/jpeg');
        res.send(outputBuffer);
        console.log(`Converted successfully.`);

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).send('Conversion failed: ' + error.message);
    }
});

app.get('/health', (req, res) => {
    res.send({ status: 'ok', message: 'HEIC Converter Server Running' });
});

app.listen(PORT, () => {
    console.log(`HEIC Converter Server running on http://localhost:${PORT}`);
});
