const express = require('express');
const multer = require('multer');
const {
  changeHairColor,
  changeHairStyle,
  getHairStyles,
  getHairColors,
  getProcessingHistory,
  analyzeFaceShape,
  getFaceAnalysisHistory
} = require('../controllers/hairController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.post('/change-color', upload.single('image'), changeHairColor);
router.post('/change-style', upload.single('image'), changeHairStyle);
router.post('/analyze-face', upload.single('image'), analyzeFaceShape);
router.get('/styles', getHairStyles);
router.get('/colors', getHairColors);
router.get('/history', getProcessingHistory);
router.get('/face-analyses', getFaceAnalysisHistory);

module.exports = router;