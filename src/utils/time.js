export function fastFormatDate(date) {
    return date.toLocaleString('zh-CN', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3 
    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$1-$2-$3');
  }
  // 输出: "2025-03-25 22:00:14.163"