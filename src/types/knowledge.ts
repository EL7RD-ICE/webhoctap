export interface KnowledgePost {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  createdAt: number;
  likes: number;
}
