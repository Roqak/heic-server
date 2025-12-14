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

        // Check if input is already JPEG or PNG
        const header = imageFile.data.slice(0, 4).toString('hex');
        const isJpeg = header.startsWith('ffd8');
        const isPng = header.startsWith('89504e47');

        let outputBuffer;

        if (isJpeg || isPng) {
            console.log('Input is already JPEG/PNG, passing through...');
            // Ideally we could use Sharp here to resize/reformat if needed, 
            // but to keep dependencies minimal (avoiding sharp install issues), we just return the buffer.
            // If the user requested PNG but got JPEG, we ideally convert, but passthrough prevents crash.
            outputBuffer = imageFile.data;

            // basic format adjustment if we really want to be correct (requires Sharp or similar if we want to change format)
            // For now: Preventing the crash is priority.

            // Adjust response content type based on actual detection
            res.set('Content-Type', isPng ? 'image/png' : 'image/jpeg');
        } else {
            // Assume HEIC
            outputBuffer = await heicConvert({
                buffer: imageFile.data,
                format: format.toUpperCase(), // 'JPEG' or 'PNG'
                quality: quality
            });
            res.set('Content-Type', format === 'PNG' ? 'image/png' : 'image/jpeg');
        }

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
