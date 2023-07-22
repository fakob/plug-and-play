import React from 'react';
import { AbstractType } from './abstractType';
import * as PIXI from 'pixi.js';


export class HighPerformanceTextureType extends AbstractType {
    constructor() {
        super();
    }

    getName(): string {
        return 'High Performance Texture';
    }

    getDefaultValue(): any {
        return undefined;//new PIXI.Texture();
    }

    getComment(data: any): string {
        return data ? 'Image' : 'No Image';
    }

    recommendedOutputNodeWidgets(): string[] {
        return [];
    }

    recommendedInputNodeWidgets(): string[] {
        return [];
    }
}
