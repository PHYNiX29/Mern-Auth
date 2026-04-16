import mongoose from 'mongoose';

const uri = 'mongodb+srv://vsundriyalbe23:TgdINYl0OgjH63tA@cluster0.l0vl4.mongodb.net/primetrade?retryWrites=true&w=majority&appName=Cluster0';

async function clearDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected. Dropping database...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped successfully.');
  } catch (error) {
    console.error('Error dropping database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

clearDB();
