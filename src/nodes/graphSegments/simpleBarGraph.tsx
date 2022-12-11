import { Segment } from './segment';
import { SegmentNode } from './segmentNode';

export class SimpleBarGraphSegmentNode extends SegmentNode {
  protected getSegment(): Segment {
    return new SimpleBarGraph();
  }
}

class SimpleBarGraph extends Segment {
  getName(): string {
    return 'Simple Bar Graph';
  }
  getDescription(): string {
    return 'Simple Bar Graph Segment';
  }
  getData(): string {
    return '{\n\
  "version": 0.1,\n\
  "nodes": [\n\
    {\n\
      "id": "friendly-cobra-87",\n\
      "name": "Execute Draw Rectangles",\n\
      "type": "ExecuteMacro",\n\
      "x": 1527.689449632939,\n\
      "y": -4050.9667993733515,\n\
      "width": 285.0137349390118,\n\
      "height": 184,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Code",\n\
          "dataType": "{"class":"CodeType","type":{}}",\n\
          "data": "async (Values, Labels, Colors) => {\n      \treturn await macro("DrawBars", Values, Labels, Colors);\n      }",\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Values",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Labels",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Colors",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "OutData",\n\
          "dataType": "{"class":"FunctionType","type":{}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": true,\n\
        "intervalFrequency": 300\n\
      }\n\
    },\n\
    {\n\
      "id": "chilly-deer-54",\n\
      "name": "DrawBar",\n\
      "type": "Macro",\n\
      "x": 204.73049097895495,\n\
      "y": -5567.390062790497,\n\
      "width": 1345.739462207936,\n\
      "height": 650.9531654238663,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Output",\n\
          "dataType": "{"class":"FunctionType","type":{}}",\n\
          "defaultData": 0,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 1",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0,"maxValue":100,"stepSize":0.01}}",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 2",\n\
          "dataType": "{"class":"StringType","type":{}}",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 3",\n\
          "dataType": "{"class":"ColorType","type":{}}",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 4",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0,"maxValue":100,"stepSize":0.01}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": false,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "terrible-chipmunk-76",\n\
      "name": "DRAW_Shape",\n\
      "type": "DRAW_Shape",\n\
      "x": 745.1703863732636,\n\
      "y": -5497.250627432883,\n\
      "width": 160,\n\
      "height": 208,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Shape",\n\
          "dataType": "{"class":"EnumType","type":{"options":[{"text":"Circle","value":"Circle"},{"text":"Rectangle","value":"Rectangle"},{"text":"Rounded Rectangle","value":"Rounded Rectangle"},{"text":"Ellipse","value":"Ellipse"}]}}",\n\
          "data": "Rounded Rectangle",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Color",\n\
          "dataType": "{"class":"ColorType","type":{}}",\n\
          "defaultData": {\n\
            "r": 255,\n\
            "g": 55,\n\
            "b": 0,\n\
            "a": 1\n\
          },\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Width",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":1,"maxValue":1000,"stepSize":0.01}}",\n\
          "data": 209,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Height",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":1,"maxValue":1000,"stepSize":0.01}}",\n\
          "defaultData": 200,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Border",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset X",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 225.64073347433327,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 85.0746635984433,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale X",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Angle",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-180,"maxValue":180,"stepSize":0.01}}",\n\
          "data": 0,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Pivot",\n\
          "dataType": "{"class":"EnumType","type":{"options":[{"text":"top left","value":{"x":0,"y":0}},{"text":"top center","value":{"x":0.5,"y":0}},{"text":"top right","value":{"x":1,"y":0}},{"text":"center left","value":{"x":0,"y":0.5}},{"text":"center center","value":{"x":0.5,"y":0.5}},{"text":"center right","value":{"x":1,"y":0.5}},{"text":"bottom left","value":{"x":0,"y":1}},{"text":"bottom center","value":{"x":0.5,"y":1}},{"text":"bottom right","value":{"x":1,"y":1}}]}}",\n\
          "data": {\n\
            "x": 0,\n\
            "y": 0\n\
          },\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Always Draw",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Absolute Positions",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Injected Data",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "data": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Graphics",\n\
          "dataType": "{"class":"DeferredPixiType","type":{}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "warm-bear-86",\n\
      "name": "DRAW_Text",\n\
      "type": "DRAW_Text",\n\
      "x": 740.3377131732109,\n\
      "y": -5266.949393530444,\n\
      "width": 160,\n\
      "height": 208,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Text",\n\
          "dataType": "{"class":"StringType","type":{}}",\n\
          "defaultData": "ExampleText",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Size",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":1,"maxValue":100,"stepSize":0.01}}",\n\
          "data": 32,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Line Height",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":1,"maxValue":100,"stepSize":0.01}}",\n\
          "data": 15,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Width",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":0,"maxValue":1000,"stepSize":0.01}}",\n\
          "data": 340,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Color",\n\
          "dataType": "{"class":"ColorType","type":{}}",\n\
          "data": {\n\
            "r": 0,\n\
            "g": 0,\n\
            "b": 0,\n\
            "a": 1\n\
          },\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset X",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 279,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 124,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale X",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Angle",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-180,"maxValue":180,"stepSize":0.01}}",\n\
          "data": 0,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Pivot",\n\
          "dataType": "{"class":"EnumType","type":{"options":[{"text":"top left","value":{"x":0,"y":0}},{"text":"top center","value":{"x":0.5,"y":0}},{"text":"top right","value":{"x":1,"y":0}},{"text":"center left","value":{"x":0,"y":0.5}},{"text":"center center","value":{"x":0.5,"y":0.5}},{"text":"center right","value":{"x":1,"y":0.5}},{"text":"bottom left","value":{"x":0,"y":1}},{"text":"bottom center","value":{"x":0.5,"y":1}},{"text":"bottom right","value":{"x":1,"y":1}}]}}",\n\
          "data": "[Circular]",\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Always Draw",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Absolute Positions",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Injected Data",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "data": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Graphics",\n\
          "dataType": "{"class":"DeferredPixiType","type":{}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "nasty-newt-18",\n\
      "name": "DRAW_Combine",\n\
      "type": "DRAW_Combine",\n\
      "x": 1161.7468909034405,\n\
      "y": -5332.103516975515,\n\
      "width": 160,\n\
      "height": 136,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Foreground",\n\
          "dataType": "{"class":"DeferredPixiType","type":{}}",\n\
          "defaultData": {},\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Background",\n\
          "dataType": "{"class":"DeferredPixiType","type":{}}",\n\
          "defaultData": {},\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset X",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 270.79447205038105,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 38.48675300626928,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale X",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Angle",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-180,"maxValue":180,"stepSize":0.01}}",\n\
          "data": 0,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Pivot",\n\
          "dataType": "{"class":"EnumType","type":{"options":[{"text":"top left","value":{"x":0,"y":0}},{"text":"top center","value":{"x":0.5,"y":0}},{"text":"top right","value":{"x":1,"y":0}},{"text":"center left","value":{"x":0,"y":0.5}},{"text":"center center","value":{"x":0.5,"y":0.5}},{"text":"center right","value":{"x":1,"y":0.5}},{"text":"bottom left","value":{"x":0,"y":1}},{"text":"bottom center","value":{"x":0.5,"y":1}},{"text":"bottom right","value":{"x":1,"y":1}}]}}",\n\
          "data": "[Circular]",\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Always Draw",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Absolute Positions",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Injected Data",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "data": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Graphics",\n\
          "dataType": "{"class":"DeferredPixiType","type":{}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "hungry-wasp-54",\n\
      "name": "DrawBars",\n\
      "type": "Macro",\n\
      "x": 201.22893308202947,\n\
      "y": -4839.4009430560745,\n\
      "width": 936.8223619033648,\n\
      "height": 504.6823897346794,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Output",\n\
          "dataType": "{"class":"FunctionType","type":{}}",\n\
          "defaultData": 0,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 1",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 2",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 3",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Parameter 4",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0,"maxValue":100,"stepSize":0.01}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": false,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "popular-sheep-72",\n\
      "name": "MapSequential",\n\
      "type": "MapSequential",\n\
      "x": 484.3649628349102,\n\
      "y": -4790.9751407052245,\n\
      "width": 160,\n\
      "height": 160,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Code",\n\
          "dataType": "{"class":"CodeType","type":{}}",\n\
          "data": "(Values, Names, Colors) => {\n\tconst toReturn = [];\n\tfor (let i = 0; i < Values.length; i++){\n\t\ttoReturn.push(await macro("DrawBar", Values[i], Names[i], Colors[i]));\n\t}\n\treturn toReturn;\n}",\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Values",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Names",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Colors",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "ArrayOut",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "big-wombat-72",\n\
      "name": "Multiply",\n\
      "type": "Multiply",\n\
      "x": 438.648926508606,\n\
      "y": -5445.049424317775,\n\
      "width": 160,\n\
      "height": 112,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "Input",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":-10,"maxValue":10,"stepSize":0.01}}",\n\
          "defaultData": 0,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Input 2",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0,"maxValue":100,"stepSize":0.01}}",\n\
          "data": 74.81,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Output",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0,"maxValue":100,"stepSize":0.01}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    },\n\
    {\n\
      "id": "popular-sheep-12",\n\
      "name": "DRAW_COMBINE_ARRAY",\n\
      "type": "DRAW_COMBINE_ARRAY",\n\
      "x": 821.3009144748783,\n\
      "y": -4659.351555872586,\n\
      "width": 160,\n\
      "height": 184,\n\
      "triggerArray": [],\n\
      "socketArray": [\n\
        {\n\
          "socketType": "in",\n\
          "name": "GraphicsArray",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "defaultData": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Number Per Column",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":0,"maxValue":100,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Spacing X",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":0,"maxValue":1000,"stepSize":0.01}}",\n\
          "data": 224,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Spacing Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":0,"maxValue":1000,"stepSize":0.01}}",\n\
          "data": 300,\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset X",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": 182.8715349807776,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Offset Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-2000,"maxValue":2000,"stepSize":0.01}}",\n\
          "data": -122.77093224677992,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale X",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Scale Y",\n\
          "dataType": "{"class":"NumberType","type":{"round":false,"minValue":0.01,"maxValue":10,"stepSize":0.01}}",\n\
          "data": 1,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Angle",\n\
          "dataType": "{"class":"NumberType","type":{"round":true,"minValue":-180,"maxValue":180,"stepSize":0.01}}",\n\
          "data": 0,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Pivot",\n\
          "dataType": "{"class":"EnumType","type":{"options":[{"text":"top left","value":{"x":0,"y":0}},{"text":"top center","value":{"x":0.5,"y":0}},{"text":"top right","value":{"x":1,"y":0}},{"text":"center left","value":{"x":0,"y":0.5}},{"text":"center center","value":{"x":0.5,"y":0.5}},{"text":"center right","value":{"x":1,"y":0.5}},{"text":"bottom left","value":{"x":0,"y":1}},{"text":"bottom center","value":{"x":0.5,"y":1}},{"text":"bottom right","value":{"x":1,"y":1}}]}}",\n\
          "data": {\n\
            "x": 0,\n\
            "y": 0\n\
          },\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Always Draw",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": true,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Absolute Positions",\n\
          "dataType": "{"class":"BooleanType","type":{}}",\n\
          "data": false,\n\
          "visible": false\n\
        },\n\
        {\n\
          "socketType": "in",\n\
          "name": "Injected Data",\n\
          "dataType": "{"class":"ArrayType","type":{}}",\n\
          "data": [],\n\
          "visible": true\n\
        },\n\
        {\n\
          "socketType": "out",\n\
          "name": "Graphics",\n\
          "dataType": "{"class":"DeferredPixiType","type":{}}",\n\
          "visible": true\n\
        }\n\
      ],\n\
      "updateBehaviour": {\n\
        "update": true,\n\
        "interval": false,\n\
        "intervalFrequency": 1000\n\
      }\n\
    }\n\
  ],\n\
  "links": [\n\
    {\n\
      "id": 10,\n\
      "sourceNodeId": "nasty-newt-18",\n\
      "sourceSocketName": "Graphics",\n\
      "targetNodeId": "chilly-deer-54",\n\
      "targetSocketName": "Output"\n\
    },\n\
    {\n\
      "id": 19,\n\
      "sourceNodeId": "chilly-deer-54",\n\
      "sourceSocketName": "Parameter 3",\n\
      "targetNodeId": "terrible-chipmunk-76",\n\
      "targetSocketName": "Color"\n\
    },\n\
    {\n\
      "id": 17,\n\
      "sourceNodeId": "big-wombat-72",\n\
      "sourceSocketName": "Output",\n\
      "targetNodeId": "terrible-chipmunk-76",\n\
      "targetSocketName": "Height"\n\
    },\n\
    {\n\
      "id": 8,\n\
      "sourceNodeId": "chilly-deer-54",\n\
      "sourceSocketName": "Parameter 2",\n\
      "targetNodeId": "warm-bear-86",\n\
      "targetSocketName": "Text"\n\
    },\n\
    {\n\
      "id": 3,\n\
      "sourceNodeId": "terrible-chipmunk-76",\n\
      "sourceSocketName": "Graphics",\n\
      "targetNodeId": "nasty-newt-18",\n\
      "targetSocketName": "Foreground"\n\
    },\n\
    {\n\
      "id": 4,\n\
      "sourceNodeId": "warm-bear-86",\n\
      "sourceSocketName": "Graphics",\n\
      "targetNodeId": "nasty-newt-18",\n\
      "targetSocketName": "Background"\n\
    },\n\
    {\n\
      "id": 22,\n\
      "sourceNodeId": "popular-sheep-12",\n\
      "sourceSocketName": "Graphics",\n\
      "targetNodeId": "hungry-wasp-54",\n\
      "targetSocketName": "Output"\n\
    },\n\
    {\n\
      "id": 13,\n\
      "sourceNodeId": "hungry-wasp-54",\n\
      "sourceSocketName": "Parameter 1",\n\
      "targetNodeId": "popular-sheep-72",\n\
      "targetSocketName": "Values"\n\
    },\n\
    {\n\
      "id": 14,\n\
      "sourceNodeId": "hungry-wasp-54",\n\
      "sourceSocketName": "Parameter 2",\n\
      "targetNodeId": "popular-sheep-72",\n\
      "targetSocketName": "Names"\n\
    },\n\
    {\n\
      "id": 18,\n\
      "sourceNodeId": "hungry-wasp-54",\n\
      "sourceSocketName": "Parameter 3",\n\
      "targetNodeId": "popular-sheep-72",\n\
      "targetSocketName": "Colors"\n\
    },\n\
    {\n\
      "id": 16,\n\
      "sourceNodeId": "chilly-deer-54",\n\
      "sourceSocketName": "Parameter 1",\n\
      "targetNodeId": "big-wombat-72",\n\
      "targetSocketName": "Input"\n\
    },\n\
    {\n\
      "id": 20,\n\
      "sourceNodeId": "popular-sheep-72",\n\
      "sourceSocketName": "ArrayOut",\n\
      "targetNodeId": "popular-sheep-12",\n\
      "targetSocketName": "GraphicsArray"\n\
    }\n\
  ]\n\
}';
  }
}
