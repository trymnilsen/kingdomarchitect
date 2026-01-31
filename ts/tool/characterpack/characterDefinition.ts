export interface AnchorLayerDefinition {
    front: string;
    back: string;
}

export interface AnchorDefinition {
    id: string;
    layer: AnchorLayerDefinition;
}

export interface CharacterDefinition {
    colors: Record<string, string>;
    width: number;
    height: number;
    offset: number;
    animations: string[];
    anchors?: AnchorDefinition[];
}
