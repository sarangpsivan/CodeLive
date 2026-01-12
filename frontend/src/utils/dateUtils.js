export function timeAgo(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    // Handle future dates (e.g. server time drift)
    if (seconds < 0) return "Just now";
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
}
