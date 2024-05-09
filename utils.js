function calculateReadingTime(content, averageReadingSpeed = 200) {
    const words = content.split(/\s+/).filter(word => word !== '');
    const wordCount = words.length;
    const readingTime = Math.ceil(wordCount / averageReadingSpeed);
    return readingTime;
}

module.exports = { calculateReadingTime };