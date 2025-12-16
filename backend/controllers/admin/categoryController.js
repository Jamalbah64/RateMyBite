//Category management for the admin panel

const Category = require('../../models/Category');

exports.getCategories = async (req, res) => {
    const categories = await Category.find();
    res.json(categories);
};

exports.createCategory = async (req, res) => {
    const { name, description } = req.body;
    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Category already exists' });
    const category = await Category.create({ name, description });
    res.status(201).json(category);
};

exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
};

exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
};
