//Defined routes for admin category management

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/categoryController');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

router.get('/', verifyToken, authorizeRoles('admin'), controller.getCategories);
router.post('/', verifyToken, authorizeRoles('admin'), controller.createCategory);
router.put('/:id', verifyToken, authorizeRoles('admin'), controller.updateCategory);
router.delete('/:id', verifyToken, authorizeRoles('admin'), controller.deleteCategory);

module.exports = router;

