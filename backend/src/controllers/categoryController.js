const { db } = require('../config/firebase');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const snapshot = await db.collection('categories').get();
    const categories = [];
    snapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Create a category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const newCategory = {
      name,
      description: description || '',
      image: image || '',
      createdAt: new Date().toISOString()
    };
    const docRef = await db.collection('categories').add(newCategory);
    res.status(201).json({ id: docRef.id, ...newCategory });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};
