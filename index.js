const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URL;
const client = new MongoClient(uri);
let db;


// Connect to MongoDB once when the server starts
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db('test'); // Set the database connection
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}


// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});


// API to get event gallery item by eventId and galleryId
app.get('/api/event/:eventId/gallery/:galleryId', async (req, res) => {
  try {
    const collection = db.collection('EventInfo');
    const event = await collection.findOne({ _id: new ObjectId(req.params.eventId) });

    if (event) {
      const selectedGalleryItem = event.event_gallery.find(
        (item) => item.id === req.params.galleryId
      );
      if (selectedGalleryItem) {
        res.json(selectedGalleryItem);
      } else {
        res.status(404).json({ message: 'Gallery item not found' });
      }
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// API to fetch all events with specific fields
// app.get('/api/events', async (req, res) => {
//   try {
//     const collection = db.collection('EventInfo');
//     const events = await collection.find({}).toArray();

//     const filteredEvents = events.map((event) => ({
//       _id: event._id,
//       event_name: event.event_name,
//       event_date: event.event_date,
//       promptTitle: event.promptTitle,
//     }));

//     res.json(filteredEvents);
//   } catch (error) {
//     console.error('Error fetching events:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


// API to fetch specific event by uniqueID with gallery image URLs
app.get('/api/event/:uniqueID', async (req, res) => {
  try {
    const collection = db.collection('EventInfo');
    const event = await collection.findOne({ unique_id: req.params.uniqueID });

    if (event) {
      // Check if generatedImages exists for each galleryItem, if not, default to an empty array
      const galleryImageUrls = event.event_gallery.flatMap((galleryItem) => {
        return galleryItem.generatedImages ? galleryItem.generatedImages : [];
      });

      res.json({
        unique_id: event.unique_id,
        event_name: event.event_name,
        event_date: event.event_date,
        promptTitle: event.promptTitle,
        galleryImageUrls: galleryImageUrls,
      });
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Start the server and connect to MongoDB
app.listen(port, async () => {
  await connectToDatabase();
  console.log(`Server running on port ${port}`);
});