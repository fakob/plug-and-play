/* eslint-disable prettier/prettier */
import * as PIXI from 'pixi.js';
import PPGraph from '../../classes/GraphClass';
import UpdateBehaviourClass from '../../classes/UpdateBehaviourClass';
import { CustomArgs, TRgba} from '../../utils/interfaces';
import { NODE_TYPE_COLOR, SOCKET_TYPE } from '../../utils/constants';
import Socket from '../../classes/SocketClass';
import { AnyType } from '../datatypes/anyType';
import { ArrayType } from '../datatypes/arrayType';
import { CodeType } from '../datatypes/codeType';
import {  inputHeightName, inputWidthName } from '../draw/draw';
import { NumberType } from '../datatypes/numberType';
import { DRAW_Base, injectedDataName } from '../draw/abstract';

const defaultVertex = `
precision mediump float;
attribute vec2 aVertexPosition;
attribute vec3 aColor;
attribute vec2 vUV;

uniform mat3 translationMatrix;
uniform mat3 projectionMatrix;
uniform float time;

varying vec2 uv;

void main() {
  uv = vUV;
  gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
}`;

const defaultFragment = `
precision mediump float;
uniform float time;

// designate your input data yourself, it will be automatically fed in here
//uniform float inputData;
varying vec2 uv;

void main() {
  gl_FragColor = vec4(0.5,uv*vec2(sin(time),cos(time)),1.0);
}

`;

const errorFragment = `
precision mediump float;
varying vec2 uv;

void main() {
  gl_FragColor = vec4(1,0,0,1.0);
}
`;
const vertexShaderInputName = 'Vertex';
const fragmentShaderInputName = 'Fragment';
const inputDataName = 'Input';

const imageInputDataName = 'Images';
const imageNamesName = 'ImageNames';

const defaultImage =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCADTANwDASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAABQYDBAACBwEI/8QANRAAAQQBAwQBAwMCBgEFAAAAAQACAxEEBRIhBjFBURMiYXEUMoEHIxUWM0KRoXI0Q1Ji0f/EABoBAAMBAQEBAAAAAAAAAAAAAAIDBAEABgX/xAAhEQADAAIDAAIDAQAAAAAAAAAAAQIDERIhMUFRBBMiMv/aAAwDAQACEQMRAD8AXdUk/c0AAkpV1q2xc3/wmTOnY7KcD78pe6mYf3B30keF8p7PtTE/QF0pjxluO4UAD2TK2cv58pVxXbX3Zs8WjGPOWuAPZBWzeE/QViJDi7dX8BX8R49XXsILHM4u8K9izFrXBx5XdmOJ+ggSdo5oXfAWYupy4OXVExkUaWkBD4QSeVFmtaWOr9wamzvQpwmO+NMzKx2vY4C0Q00hpIK5voOsnFl+GZ1N8WnbF1FrKe6RoaRa1zsU1KGUPO4cf9LZ7NzXfdUMLUoMigyVm71aMx4Uz4dzBwey1SakiPAGyaMF3+7jhHSQLDyPtaq4GgZ0myZtcekcj0LNdbpA0n7ruJra8BbzxwQqk4dIa4A88d0azdOmijuRov2EDy90Q5NX2R6B2gLrUW10dEcIto8dxB5IAA9Jd1fUoWzNjc9ocDzZVnB6jw8WM/JK2vsEUrRjaLmugMzIDu4NeEP1YiMtIrjkrzW+otOyY45I3hz2eAkbqjrBrm7GAX2sI2zlrYc17WcfGx9sb2l9JFkjnz8ppLiW3aDNmyM/LL3ucWp60DFAa0lwJUt0Uxjlh3pXDdFVi3eqT/pbnSbg5lfhCdMia0x7WtaSOSmXBhDA47qtR3tj/wBchvBlaGtaWn+Veml/tONgcWgTZnRyAk7gfSmypy6LcKDR3WY9iriRX6hyTLlFl/SeUHAaB5VrUpWnKJPhUTML4BVk9on4ScumMf6h4kJFv4VfqLGEmKTH2291vngiX9psG1azwHae/wBhtremUyc+glDHFndwPCvwyFzbdwULDjFO81bi4q7jOc5/Pa+yFrsMJQuJdwr0ZuyVVga0PbwBavXGBQPK5oxlzHIETfP2UjonOca8hQQH+02j2KKQFrjZbYqkcCmLk2M8ZDT4BTDhRPmxHAk7vytMnFMj/oaQpMXEzWuDYmnnzSckhTnsUdayNQ0vN+Vhe1oPBB4Ke+if6mzCJmPk043QJ7qfP6Tl1LCqUO31fAVXo7+lmQddhkc95jaSeyJSZ0jtej9VythjLoraW2OOEz6b1BHlPaxzacR6UGP03DDhRtoFzAEI1dzdLZ8jAN444CPiJfY6ZcEeXBTgHEjhcv8A6gaDkxYM0sBLS3kUU99MaoczDa6QfUtOodmRizMdZsLuBnh8SdRalnQ6lM2WWQEOI/chrNWynBw+V5H/AJJr/qbpjI9aldGCSXeEkNi+KRxeLtZw+gNsN4eXMwh5mfz7NqCbKe/LPkD3yhcmQ8kNjNAe1pDM5kr3EbiSOyxoPG+zougQg4weas+E4aKx7SSRTR5SPoWR/YayyD6TroshdC4E8Dwocp9HFrQ/adIWCNx7AcIzHnU1wJ/cUlQamGRtaeOFfw850l0pNjGxtxswWQb/ACVmZlBuO9rHW4n2h2E4Padw5CiypQHUapUYse1sTbBk+58t2tfhKkkIo7RytonNcwEmj5VGtEjfZyvUX1IbAHNKWQGTCcQRy3leahtLS6r+rysEhOKWta3lpqlPJcjm2c34854HItXsOUBwoFVtWifFmvc9tC1e0OESlznfwnT2ai9G/eRQ7cq/iRiWVxtVnY4YLbwUT0qE7XHndSyno1rQTx4AyHsCpouGgltG6P2WMdUQsK1G0bQTwVs0KpDFpGFFLC2Rwae18JlwMTGZOAY2hJml6i/FJaeWE8Wj0eqh1PBBKfL+BLXY84cEI4axptMegshgdJw0Vz2XLf8AMzsct20b9ItjdTzGJzmggEeU1PsU0dV/URvBDSCkbqvGky53NYTQ54Cj6f1jJy5HUygD4TOMT5XbiLv2nIHWkUelsY4+KA7uPsr2sxkYj3sbfHhW8fH+N1NbVKTLjEkb2uP09iu2Do+RP6mA42syukbxf/6ucTP+WUuHZfQP9ZejRkSOniMnPNgFcAlgONnOgd3ZYN+UIPIHyhu87u/gKTHZusi+OV5mt3StAoUo8eT430SUDCmlsbdMkMMW5p5HJTLpepStAAPfxSQ8bLB430QeyZ9Dd8jQd3nhS5Fsrix2wnHIlG40mrS8f44Sd1m0l4MphlaP+05dPyNlie0nk/8AajWJj9h/FeWs/hQZDwZKIRmKGKGAb287UDk/1XevCrxxpCbezBQuxahe5gcQAR+FMwbt20g1wvWwkiyEfFieP2cv1CPbE5kf/wAj3QxmWYvod3ApMboPmjNDk+ShOVpwbLtDefuoky6V0L/UmnCfFbNEORyaQ/R3VAWtB+QLqWjaJFlYL2SVRbQ48pcf0icOeSTcXNTVaDUC+35C4bgj+ngXShfiU4CiFaxcZzASEFNM6loI/S5lUApKBc7kcKFxLQO1cKrPl7HECjxysliaRtk5Px02hXtaYmZKZCGvIA8ITlZokeA6gB6UuEXuf/bspqpiX2MmKJHvaAS78p90PTTPEGuIpLGgYTpYo5HNop4wf7AaCSfvSbzAU7GnQcVmM0GMAn8JohduDT7SZg55i7Gz6pHcTOqi8VabOQ14+g6DQWsh4ffAVSLK39jwocjK/cC4lHz2xDWiHVcSDUMUwuY0kiuQvl7r3o+SDqCeXa1sRd3DV9SxvDtvkpL690/HnwpJHspw549py0Ja0fJuq6LMJD8TeAgmTiSwE7mrreo4rHOdTCLJSnm6f8szmmxxSCkB8iXFZB9o3pGXJDsBeaBUWVgjGkIDbUUTTvFCip7Q/HTOh6Zmb2g3uTh0rkH9XyCBS5voeRbw3zS6R0niySbn7f5CDiUc2POXlF4jHgBDWl75OWkC+6lY4mXa8GgpjtLXEGgmpaQHMjYAw/Se5W3yO9qGaIgtAJu74UwhctB5sUIo7hOyrtauxyX2QLpXYsfYbUjmWdwC+NeRo+tj77COkxhmMzaoNVx3PFNqld0xpOM3iqVgx7paIU/7mUqdidkaOSNwaLKrfoJGE+gnaSKEMFXapZ2K0McW3YCZGR/INwtCVmhsUZDjyOUtZuYXTvq9qZtUDg9+4cJcyoR85cFXj/ohtfAImkduuhyfKb+m8d08bOAD9kLxsEZUjWiPt/wnLQdPdBsDmlrfYTuIpobNHw/jga1rea8BFZYTE3d58BVdPl/TlhcVPqWSKuhzz3WPoKETYkjhsfZPNFH2zkxtFV6KVYsxsLOHBXINS3uaN445WK9DNbGpmQYobvv2VY5VtLnGlSlzGGOOiPwhsuaxzjx5pMWQnyQOGnSh7mm7W2s47J8SRjmB24JfwNSayWgQLCNfrWSRVvbdeSq8d7JaRz3UemGFxDWNsH0krqPp8YrHOG0O8gLsWUA530ua6+eEr9Q4YyA9m2y4VYCb6K0fOWrRlk0jT39oSxpa77/cLpXUHT8ePO90rHX7SjqGLHGHPDTQHKBwbLK2kZAjyAZDTeF2vpLWdPj0x4+VpkHAF918/uaSSGnv2CMdP5EuPP8AVIQB3XTGjXbPoFuR8oa5oAB57oZkZro3OsWPyqmi5bJcFjg8E7f5VfUHNc+7JK1ybL2g7iagHys3gAEd/SJfr4gSLSZDK9o4PPFWiLMsbfrIDkPEIv7LYQ1o7rR0ZbQv/pX3ja0ccn7KWPHJNv5C8/kaPs4ZfE9w2GOJob5Vh3Ep/C0eGhlDhQF21x5NqctS0jYtvj0ocxrnGh2LVvFKL5Xkk5s7Bf5RyKvsWdVwNtuLd1pfnw4w8l7aTxnTbotrmBJ/UVR4z3x2XjurcLI6XyQx52JgxF5PPalVb15BFNsugztS55m5WS+V+8mgfJQXIle6R1K2VskyXo7JF/UHHllawyE8/wDCO43UTMwn4zuFVyV89RPc124kJi0TWZsd7acdotdkjSAx5ds7a7M+TntXoq3ikuNh7hYrhLOk5QycOE0Nx5KORWKNkfhTN6Lona2GGPeO73HbyLKy3jsb5tUI3EF1k0SpMe5C4WVie2JyLQQbkSRnc51ULVKbqAxyh3yGvPPZXMiHZiGySdqSNRyGw48zjxQ4X0MPhFQcz+t24jd7sigPFhBc3+qmG3wXOHm1xfqHUpMnKkDz54rhBDI5rbaT/wAp6Yh+nWdT6+h1HIHyR8HzfCC6zlRvxHuiePqrsUnYr90Y3E2rGEHTse1pNt9othLwmhe18vBvai2CA54/KAOxJoJSRzfpTQZzsV437rB8haKezqnTuQ+GVjAfoI7JkyowaN8kJJ6XyxnyxbCLHH8p5zYjEW7u3CxoKfogrbRWrpeTwtt27hV3XZ+krpHyPlbdrhzyp3upZHEbrwAq+U8MkF+l5bN6eg/HW5K805Y832VcyF5sWtJHb3ErLa1hPPCxLY5vR6958WFs2UNbzZKqOyGHvaiM4JIBKdE/YlvZNK4vG51UTRCXeoWNdFIyNpJIRoWeAQVVyoDMS3bxVWny1LE1O0cV1cObPIx3Dr7IE9pJcXWPwuta70cZ5vmY6r7UEpaj0xk48haGFze9gKqMqR8/JioTIGF8lOuvCLRxhnP2pEYdI+I/3WO/4WZOC/cBFG7b7pHeRUBGJpjl0M/dGASTwas/ZP0LKjBPpJHSEL4IYtrad2T0wu205R16fSxJ8Txz6r0rGCSC6q5PlQOA28eER02Dc0u5KPF6IyIJzNDsUsPct7rlPW0T44ZGgloXYsbGbNAGuB4HCQeudFJZJ9JIrwF9LEuiO5PnvKg3SSODiTflVzjuEXI4KZMjR5/1D2iF4F+lPD0xnS0GQSbT5pMQh4xaxWgCjwrulQzTZhbA01dGgui6D/TOeeSN2V8jWHvwug6P0DpmmW4RkyH/AHFboxTo4xLhz4c0TpmO2n2FKdNh1AuAAB+y671D0th5cTgS5rx+0hKWJ03Nh5rA4uczd3ARSBSBXSGly6ZqUTXn6gbql0vW2H4fkIq6KodS6YIHYeVisNit1CimHKiMmjwSFt8c2io6fRSDhYWbipJGj5DxwoiRZ+lK2O4nSsZh+Mu57ITqQBcmQtEWESR3CWcyy7aeDa8zm9PQ/j9SUSPjFlDtSzxEPjaaJCt5L9rSCRaW9RJllBDkWOd+mZH2TwySTP4Jod0QERr0q2O8QwCiOe60lzdlk0VQkL2EYmhpuwVMHEHsKQRmptcasBWGZTT3ct0EtMKSOa4dgFE5kbyQ9jXfkKGCVr+7hXiyrIaCTRH8LvDXCYOyNIx5RewC/QVb/BYmtdtaL8cI38ZoU4cLZ37CL8LuYDxALG098DoyO34Rloq2km1m0uawN/2lb7BuLvPpC22alpHsEYeDuBR7BgLQ0N/YhELQWmuAQjGnTUNpA4VGBCM3Qw4MTdoHdZqOBBPbZWBwPcELMGQkcUCrW67LuT919bFPR8yq7FX/AClj/K50cTACb/aruNosWNTXRM49BFjIWlu0nsFNC9lODyL9lM4oDlspOia0MLWBoA9IXmyvYXFvPKL6jn4sLdrpW36QZ+bjTX8dFakdsEZ0jnM57oK2Z8MhdRLb5tMznxOc7eBX3WgZgytc0sDT9l2kCy7pUmFrmI2JpH6hl20+UZ1TT2f4A5rWgFnoJLmwpNKyI87THOLozbgPITro2rR6ppkjSKe5n1N+60S12csyGmOZ+7t44VUkWUZ6ggMc8ga3zyg1j0p2h010dY1R/wAeM1jB4FpdzACb8o/qBEoJaeEFyI7u+SF5XLk2z0uGP4F/MaSHWgE7Lf2TNmtDQSgOQy5iRxwqcbWheRGjHXFtI7IdqE3xxuARIMIBHtUc2IPZIB3Kcnomt/AmTaw6Gdwdanh6ka1vJdfnlA9ZjdFmPa60Je5wv7qiJ2Tc2joGN1JE/aASOe6PYmstkP0vC5LC4/GOT3tXsXPlidbXrbxb8NX5FL062M5zgB3C2OpMjv5eP4XO8XqSVjKLrpbv6kkkBuuEv9DDX5SOm4moQykNjcFbkmYLDOSQuQY3UeRFP8gI2pm0vq+KV+6Z7Q4ccrHiY2c86Og4jjtG4eEZwWsLbPBSLD1BFOPokYLHHKmh110X/uAhUYY4+gZbVI6dhOLY2kdiFvLktANu+y5zN1SY4QPkr8FANW67GPE9scu6Q/8A2X0YrSPn3r06jl65iYjXGSUAgJO1n+osEUT2Y/LjxZK5HndS5uZM5z3kgnjlV8R2+UukvnwSidCtoff8wTZX92STv2oqaLWyxlMed190qDLjYwNA5W0c7dt1SxM7Y3nWHSsFyEfyp4NYIaQD2SXHOd1Aotpg+Vr9wsfZEZse9M1UzwFpd45RLpzJMGoNo/QTyEoae0QOFA0faZ9Dj+adtccreXRj6LXVkTI9QfQ+l/KTyY7PCdep6dkGO7cG8JIeC17gWO4KTyNTOmzyODSWnglU3UQ4k2VaMv8AY3UCCqMvmwvI33R6rH/kEZotp82gsrSHO45tM8rbj7CghOTDvkJHdNh6E5QW4cWh8pIkKKTtLXlDcig53lUpk1ICanpUWVL8rqH8Jd1DQXAuMfLfHCcjyPstaBFVY9KuLSQio2cxmwpYSfSqOLmXa6ZqGkRzRNcAOUAzumXEH4w4kelTDJ6nQnMkcDwpnO+k8c0pcvTZsdxa9j+/pQmNwbQ4Pm03YlwzUi4gCVDTmmhyFIcaYNJa0n8KzDC/Y0uY7+Qs0ZpojxsubGIIkf8Ai0Wi1l4hAcXbj7KpfCT3aK9qnIQ40L4TJXQfJhjL1GaTaGOd29oRkSPLnEiyVu1zt7T3AVqa2cliYhVPZFjsLhHfcnlFfjDeQbHtUm00bxwKtafO8MfVlc3oBJ7CoIZE518ha47y5pLyaVfBY/KAYbR7D0aR4osNe1yZpvomnyZU4o037puxML9HBISQT6Cg0rE/TNa0XxSvtgkyJCKO1amYjzDZJk5LG+AnbSIRDE6R3G0IZpenCNtjh1Kxn5XxRiBh790W9nM11CUzzfISbpCDPECQ+MFw8ogwta0NJu+UOyMFz5nOjP0lB0xUsbmOPwEeBSjm/ab7reEiUAAV5Wk4omyvI10exx/5KxZuaSD3CoSRBtgk2iTTYsKtO363fhHLAuegNOwGSiELzo9juPKNz8m/SG5BEhPCoxEloEPph5Ue4E8KfKYOWjuFX2EHxwqZYpm8LzRDqpetcPm4JpaAbST7WwFO3KmH1oS+zXUcJmTH9Ibfm+6WM/QKa5wam0PDmj2t5ImyQuaP3KhA8UImLA7EaA9lkc8hNWls0/MxiyVsbXnwQFk2CHDkWSENkxXRF2w0fa19iqxjNidH4U7N8bmEEeku6h0C/wDxAiEjZfpWcDUMzGaGsLq9q9/j+UJRbzY47JiM4MpTdAyRvbRNeaCr6r0/i48bfkdb+bCLZ2uZ8sYEclVzx3Qp8c+TKHzEvNLRfAX8jFa+MNYzgBSYGiCeP9v5TRh6ZuALmInBg/GPpAA+y47iBtJ0RmK7cG2T7TJCNo2sAH8LIYnE7QicGMxkVvbbiaXMCkkURjuJ+nlxRzR8CmF0ndb4eEXOBDBXhHsOGPFYXSg2tmWAeSNZiYhca3EdkqSH5slz3C/SJ65nFxIaKHhC8BrthMnJKY0A66N5ZAyrB5FcKIZQA4CtSsBbZCXp5gyVzeUpppgDzicNvytpwHbtxHK1xx/aFLWY/wByl5N9s9jD1JFC9wLmkUAoZ2OdK4g/TSsu/YVoRUZ55pMk5lF0TDEfuhMsQbIfSLOZx/KpyxFz3CqToJrSYFmhBkJF0VRkbTzSNzsMbeeQUNliNkjgqiSZopXwL7rTncVM9m1rb8LWgWmk5Ni3Jo0mwVaY7vyoCwbeCvI3OYSO4TpsHTJy7c4fZROj3FxPKzdfIIW4fwQU6b2YRNgLuzeF5LhctOzyruPMGMrurDHNeHVXa01Mx+FAY4MgDW1xXCsxxtbu81wvRX8rWI7nPaO6JMSWmuDWANPK8dIQHV3Whjc17eRS9bH8kzqK0BlzDa4fUO5RvR8V+WXCiTao6ZEZZWsA5HC6X0jozBGXOaLtHJO6KWDp4xcffK0cDyhGqZe4FxLQ264TH1fkMga/GhIuuVz3UJHjHolOU9C2yhNKZp3UeFcxhTOfSGYo/um0RNhhIBQsE2yXUwkngcpamuSRzgRRPpH5D8rHgeBwgBY6zwUBx0FhLG0DwoX7jJZUjPqjJCx3+lZ4PZeRfp7CF/JGTxXlaykV3WdhZUMlbiHHiuEc+gt6InuO3kWLXn+55IHK3cSItvBFrRt/Xu44vlNhCn2UM6Nphsd/CFyMu7RjJYfi3VxfdUH7aJb5TpYnQKmjJjP0qiLaw33RWZriPppUpYi3c13dPRmis15oWpGkc+V4G8BbMu5Ghv8AKNMW0YCKBHZRvPJo8r2ztAAXgd9Rsdk2RbWjdjXBgJKkbIW7i30oRJXcr2/psFPQBIJn7QfN+lPjPID3OItV27r8bQFJ3bXa0QhvRebI4hpce/ZXNNx3OkLncN72qOLC5/xgG0zabhSyBsbmlNmdk92GumtPD8hrgDfgrrOBjNwdMe/uaJuvKAdIaS1jGkxgADumPqESt0fIELbO3sFTMpElUzjWuZz5tXlLgT9X8ILqUm5rhYVqKKf9XOJ+HX2KF6kSJHxur7LWFL2iGDb8op1uRKG/jdu5VDDxnCUVyiJoNI9IKWjSCYU1xb6QMvcCQQi+Q9zvpA4KCvdbilbOHthIjAC2HLgD2pYsXkn6exj/AARP/Z/Khyf3fhYsRyLor2do5W/dpv0sWJqFkGUB8QHi0Gl4dQ7LFiZIqvSJ3FEd1DmAF7Se5WLFRJhXc0ADhaHsVixGgKK9DdXhagAPcFixNQFeGRAOu+VIeNoHtYsTp8FFmTuF7H2WLE2SWw1pLR8sXA7p00//ANUB43LFirwktenWOngP0reAikwBhkBFjaVixMJqOJ9UgN1fILQB+El6x/qA+TSxYsDnwt6d+wf+IWZJIDqKxYgoIqZBPxk3ygrj9RWLElnH/9k=';
export class Shader extends DRAW_Base {
  //graphics: PIXI.Mesh;
  canvas: PIXI.Container;
  shader: PIXI.Shader;

  prevVertex: string;
  prevFragment: string;

  protected getInitialVertex(): string {
    return defaultVertex;
  }
  protected getInitialFragment(): string {
    return defaultFragment;
  }
  protected getDefaultImageData(): any {
    return undefined;
  }

  protected getDefaultImageNames(): any {
    return undefined;
  }

  getCanAddInput(): boolean {
    return true;
  }
  public getDescription(): string {
    return 'Draws a shader';
  }
  public getName(): string {
    return 'Draw shader';
  }
  protected getDefaultIO(): Socket[] {
    return [
      new Socket(SOCKET_TYPE.IN, inputDataName, new AnyType(), {}),
      new Socket(
        SOCKET_TYPE.IN,
        imageInputDataName,
        new ArrayType(),
        this.getDefaultImageData()
      ),
      new Socket(
        SOCKET_TYPE.IN,
        imageNamesName,
        new ArrayType(),
        this.getDefaultImageNames()
      ),
      new Socket(
        SOCKET_TYPE.IN,
        vertexShaderInputName,
        new CodeType(),
        this.getInitialVertex(),
        false
      ),
      new Socket(
        SOCKET_TYPE.IN,
        fragmentShaderInputName,
        new CodeType(),
        this.getInitialFragment()
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputWidthName,
        new NumberType(false, 1, 1000),
        200
      ),
      new Socket(
        SOCKET_TYPE.IN,
        inputHeightName,
        new NumberType(false, 1, 1000),
        200
      )
    ].concat(super.getDefaultIO());
  }


  getColor(): TRgba {
    return TRgba.fromString(NODE_TYPE_COLOR.SHADER);
  }

  public onNodeAdded () :void {
    super.onNodeAdded();
      this.canvas = PPGraph.currentGraph.viewport.getChildByName(
        'backgroundCanvas'
      ) as PIXI.Container;

      this.shader = PIXI.Shader.from(this.prevVertex, this.prevFragment);
  }

  constructor(name: string, customArgs: CustomArgs) {
    super(name, {
      ...customArgs,
    });

    this.prevVertex = this.getInitialVertex();
    this.prevFragment = this.getInitialFragment();
  }

  protected drawOnContainer(
    input: any,
    container: PIXI.Container,
    executions: { string: number }
  ): void {
    input = {
      ...input,
      ...input[injectedDataName][
        this.getAndIncrementExecutions(executions)
      ],
    };

      //const prevGraphics = this.graphics;

      const currentTime = new Date().getTime();

      const uniforms = {
        time: (currentTime / 1000) % 1000,
        inputData: input[inputDataName],
      };
      const images = input[imageInputDataName];
      const names = input[imageNamesName];

      let largestX = -1;
      let largestY = -1;

      if (names) {
        if (Array.isArray(names)) {
          for (let i = 0; i < names.length; i++) {
            uniforms[names[i]] = PIXI.Texture.from(images[i]);
            largestX = Math.max(largestX, uniforms[names[i]].width);
            largestY = Math.max(largestY, uniforms[names[i]].Height);
          }
        } else {
          // assume its just a single image
          uniforms[names] = PIXI.Texture.from(images);
          largestX = uniforms[names].width;
          largestY = uniforms[names].height;
        }
      }

      if (
        input[vertexShaderInputName] !== this.prevVertex ||
        input[fragmentShaderInputName] !== this.prevFragment
      ) {
        // regenerate shader
        try {
          this.prevVertex = input[vertexShaderInputName];
          this.prevFragment = input[fragmentShaderInputName];
          const newShader = PIXI.Shader.from(
            this.prevVertex,
            this.prevFragment
          );
          this.shader = newShader;
        } catch (error) {
          this.shader = PIXI.Shader.from(defaultVertex, errorFragment);
          //this.successfullyExecuted = false;
          //this.lastError = error;
          // dont apply shader if its bad
        }
      }

      const geometry = new PIXI.Geometry()
        .addAttribute(
          'aVertexPosition', // the attribute name
          [
            0,
            input[inputHeightName], // x, y
            input[inputWidthName],
            input[inputHeightName], // x, y
            input[inputWidthName],
            0,
            0,
            0,
          ], // x, y
          2
        ) // the size of the attribute

        .addAttribute('vUV', [0, 1, 1, 1, 1, 0, 0, 0], 2)
        .addIndex([0, 1, 2, 0, 2, 3]); // the size of the attribute

      const graphics = new PIXI.Mesh(
        geometry,
        new PIXI.MeshMaterial(PIXI.Texture.WHITE, {
          program: this.shader.program,
          uniforms,
        })
      );

      this.positionAndScale(graphics, input);
      container.addChild(graphics);
    };




  protected getUpdateBehaviour(): UpdateBehaviourClass {
    return new UpdateBehaviourClass(true, false, 16);
  }
}

const mandelbrotFragment = `
precision mediump float;
uniform float time;
uniform float inputData;
varying vec2 uv;


void main() {
  vec2 current = vec2(0,0);
  int max = int(inputData);
  float deathPoint = 0.;

  for (int i = 0; i < 200; i++){
    current = vec2(pow(current.x,2.) - pow(current.y,2.), current.x*current.y*2.) + (uv - vec2(0.7,0.5))*3.;
    if (length(current) > 2.){
        deathPoint = float(i);
        }
  }
  gl_FragColor = vec4(deathPoint/100.0,0,0,1);
}
`;

export class Mandelbrot extends Shader {
  protected getInitialFragment(): string {
    return mandelbrotFragment;
  }
  protected getDefaultSize(): number {
    return 20000;
  }
  public getDescription(): string {
    return 'Draws the mandelbrot fractal';
  }
  public getName(): string {
    return 'Draw mandelbrot';
  }
}

const imageFragment = `
precision mediump float;
uniform float time;

// designate your input data yourself, it will be automatically fed in here
//uniform float inputData;
varying vec2 uv;
uniform sampler2D testImage;

void main() {
  gl_FragColor = texture2D(testImage,uv) + vec4(0.2,0,0,1);
}
`;

export class ImageShader extends Shader {
  protected getInitialFragment(): string {
    return imageFragment;
  }

  protected getDefaultImageData(): any {
    return defaultImage;
  }
  protected getDefaultImageNames(): any {
    return 'testImage';
  }

  public getDescription(): string {
    return 'Draws an image rendered in a shader';
  }
  public getName(): string {
    return 'Draw image shader';
  }

}
