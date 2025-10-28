export type NodeType = 'decision' | 'aleatoire' | 'feuille';

export interface TreeNode {
  id: string;
  type: NodeType;
  titre: string;
  description?: string;
  parentId: string | null;
  children: string[];
  valeur?: number;
  probabilite?: number;
}

export interface TreeState {
  nodes: Record<string, TreeNode>;
  rootId: string | null;
  derniereModification: string | null;
}
