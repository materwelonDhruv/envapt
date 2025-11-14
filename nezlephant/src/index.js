exports.decodeNezlephantBuffer = function (buf) {
  // Very small stub: assume the buffer is utf8 text and return it
  try {
    return buf.toString('utf8');
  } catch (e) {
    return '';
  }
};
