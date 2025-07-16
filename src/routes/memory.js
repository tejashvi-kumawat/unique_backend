import express from 'express';
import { 
  getMemories, 
  addMemory, 
  deleteMemory, 
  searchMemories 
} from '../controllers/memoryController.js';

const router = express.Router();

router.get('/', getMemories);
router.post('/', addMemory);
router.delete('/:key', deleteMemory);
router.get('/search', searchMemories);

export default router;
