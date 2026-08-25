export type RGB = {
    r: number;
    g: number;
    b: number;
};

export type PdfConfig = {
    titulo: string;
    versiculo: string;
    corPrincipal: RGB;
    corSecundaria: RGB;
    corCabecalho: RGB;
    corSemanaEspecial: RGB;
    corLinhaPar: RGB;
    corLinhaImpar: RGB;
    corFonte: RGB;
    corBorda: RGB;
    quantidadeMeses: number;
};
