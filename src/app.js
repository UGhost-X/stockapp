const express = require('express');
const bodyParser = require('body-parser');
const stockRoutes = require('./routes/stockRoutes');

const app = express();

app.use(bodyParser.json());
app.use('/', stockRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});