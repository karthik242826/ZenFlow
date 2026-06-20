const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static files from the 'New folder' directory where the project files live
app.use(express.static(path.join(__dirname, 'New folder')));

// Fallback to serving index.html for any other requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'New folder', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running and listening on port ${PORT}`);
});
