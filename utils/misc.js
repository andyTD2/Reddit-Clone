const parseTimeSinceCreation = function (timeInMinutes) {
    if (timeInMinutes < 1) return "less than 1 minute ago";
    if (timeInMinutes < 60) return `${timeInMinutes} minutes ago`;
    if (timeInMinutes < 1440) return `${Math.floor(timeInMinutes / 60)} hours ago`;
    if (timeInMinutes < 43200) return `${Math.floor(timeInMinutes / 1440)} days ago`;
    if (timeInMinutes < 518400) return `${Math.floor(timeInMinutes / 43200)} months ago`;
    return `{Math.floor(timeInMinutes / 518400)} years ago`;
};

module.exports = { parseTimeSinceCreation
};