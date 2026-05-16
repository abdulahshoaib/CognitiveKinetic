/**
 * Domain categories for content classification (Feature 2)
 */

export const Domains = {
  BUSINESS: 'business',
  LOGISTICS: 'logistics',
  FINANCE: 'finance',
  PUBLIC_POLICY: 'public_policy',
  NEWS: 'news',
  HEALTHCARE: 'healthcare',
  TECHNOLOGY: 'technology',
};

export const DomainLabels = {
  [Domains.BUSINESS]: 'Business',
  [Domains.LOGISTICS]: 'Logistics',
  [Domains.FINANCE]: 'Finance',
  [Domains.PUBLIC_POLICY]: 'Public Policy',
  [Domains.NEWS]: 'News',
  [Domains.HEALTHCARE]: 'Healthcare',
  [Domains.TECHNOLOGY]: 'Technology',
};

export default Domains;
