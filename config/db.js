const mongoose = require('mongoose');

// Hardcoded MongoDB configuration
const MONGO_URI = 'mongodb+srv://siddhu_19:Siddhu19@cluster0.hmvxg0c.mongodb.net/?appName=Cluster0';

const connectDB = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 2000; // 2 seconds
  let retries = 0;

  const attemptConnection = async () => {
    try {
      // Validate MONGO_URI exists
      if (!MONGO_URI) {
        throw new Error(
          'MONGO_URI is not configured. Update the hardcoded MONGO_URI in config/db.js'
        );
      }

      // Attempt connection with timeout
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (err) {
      retries++;
      const errorMsg = err.message || err.toString();

      console.warn(
        `\n⚠️  MongoDB connection attempt ${retries}/${MAX_RETRIES} failed`
      );
      console.warn(`   Error: ${errorMsg}\n`);

      // Check for specific error types and provide guidance
      if (
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('connect ECONNREFUSED')
      ) {
        console.warn(
          '   💡 Local MongoDB is not running or not accessible on localhost:27017'
        );
        console.warn('   📝 To fix:');
        console.warn('      1. Start MongoDB locally: mongod');
        console.warn('      2. Or update MONGO_URI in .env to connect to MongoDB Atlas');
        console.warn('      3. Or install MongoDB: https://docs.mongodb.com/manual/installation/');
      } else if (
        errorMsg.includes('ENOTFOUND') ||
        errorMsg.includes('querySrv') ||
        errorMsg.includes('getaddrinfo')
      ) {
        console.warn(
          '   💡 Network error or invalid hostname in MONGO_URI (check for typos)'
        );
        console.warn('   📝 To fix:');
        console.warn('      1. Verify MONGO_URI in .env is correct');
        console.warn('      2. Check your internet connection');
        console.warn('      3. For Atlas: ensure cluster name and region are correct');
      } else if (
        errorMsg.includes('authentication failed') ||
        errorMsg.includes('bad auth') ||
        errorMsg.includes('SCRAM')
      ) {
        console.warn('   💡 Authentication failed (wrong username/password)');
        console.warn('   📝 To fix:');
        console.warn('      1. Check MongoDB username and password in MONGO_URI');
        console.warn('      2. Ensure special characters in password are URL-encoded');
        console.warn('      3. For Atlas: verify credentials in Database Access section');
      } else if (
        errorMsg.includes('timeout') ||
        errorMsg.includes('ETIMEDOUT') ||
        errorMsg.includes('serverSelectionTimeoutMS')
      ) {
        console.warn('   💡 Connection timeout (server unreachable or too slow)');
        console.warn('   📝 To fix:');
        console.warn('      1. Check firewall/network settings');
        console.warn('      2. For Atlas: ensure your IP is whitelisted (go to Network Access)');
        console.warn('      3. Check if MongoDB Atlas cluster is running');
      }

      if (retries < MAX_RETRIES) {
        console.warn(`   ⏳ Retrying in ${RETRY_DELAY / 1000} seconds...\n`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return attemptConnection();
      } else {
        console.error(
          `\n❌ MongoDB connection failed after ${MAX_RETRIES} retries`
        );
        console.error('\n🆘 Next steps:');
        console.error('   1. Start local MongoDB: mongod');
        console.error(
          '   2. OR set up MongoDB Atlas: https://www.mongodb.com/cloud/atlas'
        );
        console.error('   3. Check your MONGO_URI in .env file');
        console.error('   4. Verify network connectivity and credentials');
        console.error('\nServer will continue but API endpoints requiring the database will fail.\n');
        return false;
      }
    }
  };

  return attemptConnection();
};

module.exports = connectDB;

