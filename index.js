// app.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const ShortUrl = require('./models/shortUrl');

const app = express();

mongoose.connect('mongodb://localhost/urlShortener', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.use(bodyParser.json());

app.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;
    
    // Validation of URL
    if (!isValidUrl(longUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        let shortUrl = await ShortUrl.findOne({ longUrl });
        if (!shortUrl) {
            const shortCode = generateShortCode();
            const shortUrlData = { longUrl, shortCode };
            shortUrl = new ShortUrl(shortUrlData);
            await shortUrl.save();
        }
        res.json({ shortUrl: `${req.get('host')}/${shortUrl.shortCode}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/:shortCode', async (req, res) => {
    const { shortCode } = req.params;
    try {
        const shortUrl = await ShortUrl.findOne({ shortCode });
        if (shortUrl) {
            shortUrl.clicks++;
            await shortUrl.save();
            return res.redirect(shortUrl.longUrl);
        } else {
            return res.status(404).json({ error: 'Short URL not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

// models/shortUrl.js
const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
    longUrl: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        required: true,
        unique: true
    },
    clicks: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('ShortUrl', shortUrlSchema);

// Helper Functions
function isValidUrl(url) {
    // Regular expression for URL validation
    const urlPattern = new RegExp('^(https?://)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return urlPattern.test(url);
}

function generateShortCode() {
    // Function to generate a short code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
