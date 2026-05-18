const MAX_REPORT_TITLE_LENGTH = 86;

const cleanText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const truncateTitle = (value) => {
  const text = cleanText(value);
  if (text.length <= MAX_REPORT_TITLE_LENGTH) return text;
  return `${text.slice(0, MAX_REPORT_TITLE_LENGTH - 3).trim()}...`;
};

const getFirstContentLine = (content) => (
  String(content || '')
    .split(/\n+/)
    .map(cleanText)
    .find(line => line.length > 0)
);

export const buildReportTitle = (content, result = {}) => {
  const sourceTitle = getFirstContentLine(content);
  if (sourceTitle) return truncateTitle(sourceTitle);

  return truncateTitle(
    result?.signals?.[0]?.label ||
    result?.insights?.[0]?.title ||
    'Analysis Report'
  );
};

export const getReportTitle = (analysis) => (
  analysis?.reportTitle ||
  buildReportTitle(analysis?.sourceContent || analysis?.rawContent || '', analysis)
);
