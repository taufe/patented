require('./config/env');

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  });
