const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from the current directory (src) where the project files live
app.use(express.static(__dirname));

// Fallback to serving index.html for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
