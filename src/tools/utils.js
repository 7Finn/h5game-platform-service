const path = require('path')

exports.utils = {
  isFunction: (value) => {
    return typeof(value) === 'function'
  },
  isZipFile: (file) => {
    const fileType = path.extname(file.originalname);
    const mimeType = file.mimetype;
  
    if (fileType === '.zip' && mimeType === 'application/x-zip-compressed') return true;
    return false;
  }
}