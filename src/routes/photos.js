import express from 'express';
import { 
  getAllPhotos, 
  uploadPhoto, 
  deletePhoto, 
  getPhoto, 
  updatePhotoCaption 
} from '../controllers/photoController.js';

const router = express.Router();

router.get('/', getAllPhotos);
router.post('/upload', uploadPhoto);
router.get('/:id', getPhoto);
router.put('/:id/caption', updatePhotoCaption);
router.delete('/:id', deletePhoto);

export default router;
