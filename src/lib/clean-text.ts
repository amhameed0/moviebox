export function cleanText(text: string): string {
    if (!text) return '';
    // Remove emojis and special characters that might confuse the model
    let cleaned = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');

    // Replace excessive whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned;
}
