export interface SeedDefinition {
  key: string;
  version: number;
  title: string;
  category: string;
  language: string;
  contentType: 'PATTERN' | 'EXAMPLE';
  tags: string[];
  content: string;
}
